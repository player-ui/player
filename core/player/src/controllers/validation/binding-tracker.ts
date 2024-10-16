import type { Validation } from "@player-ui/types";
import type { ViewPlugin, Resolver, Node, ViewInstance } from "../../view";
import { NodeType } from "../../view";
import type {
  BindingInstance,
  BindingLike,
  BindingFactory,
} from "../../binding";
import { isBinding } from "../../binding";
import type { ValidationResponse } from "../../validator";

const CONTEXT = "validation-binding-tracker";

export interface BindingTracker {
  /** Get the bindings currently being tracked for validation */
  getBindings(): Set<BindingInstance>;

  /** Add a binding to the tracked set */
  trackBinding(binding: BindingInstance): void;
}
interface Options {
  /** Parse a binding from a view */
  parseBinding: BindingFactory;

  /** Callbacks when events happen */
  callbacks?: {
    /** Called when a binding is encountered for the first time in a view */
    onAdd?: (binding: BindingInstance) => void;
  };
}

/** A view plugin that manages bindings tracked across updates */
export class ValidationBindingTrackerViewPlugin
  implements ViewPlugin, BindingTracker
{
  private options: Options;

  private trackedBindings = new Set<BindingInstance>();

  constructor(options: Options) {
    this.options = options;
  }

  /** Fetch the tracked bindings in the current view */
  getBindings(): Set<BindingInstance> {
    return this.trackedBindings;
  }

  /** Add a binding to the tracked set */
  trackBinding(binding: BindingInstance) {
    if (this.trackedBindings.has(binding)) {
      return;
    }

    this.trackedBindings.add(binding);
    this.options.callbacks?.onAdd?.(binding);
  }

  /** Attach hooks to the given resolver */
  applyResolver(resolver: Resolver) {
    this.trackedBindings.clear();

    /** Each node maps to a set of bindings that it directly tracks */
    const tracked = new Map<Node.Node, Set<BindingInstance>>();

    /** Each Node is a registered section or page that maps to a set of nodes in its section */
    const sections = new Map<Node.Node, Set<Node.Node>>();

    let lastViewUpdateChangeSet: Set<BindingInstance> | undefined;

    /** Map of node to all bindings in children */
    const lastComputedBindingTree = new Map<Node.Node, Set<BindingInstance>>();
    let currentBindingTree = new Map<Node.Node, Set<BindingInstance>>();

    /** Map of registered section nodes to bindings */
    const lastSectionBindingTree = new Map<Node.Node, Set<BindingInstance>>();

    /** Map of resolved nodes to their original nodes. */
    const resolvedNodeMap: Map<Node.Node, Node.Node> = new Map();

    resolver.hooks.beforeUpdate.tap(CONTEXT, (changes) => {
      lastViewUpdateChangeSet = changes;
    });

    resolver.hooks.skipResolve.tap(CONTEXT, (shouldSkip, node) => {
      const trackedBindingsForNode = lastComputedBindingTree.get(node);

      if (!shouldSkip || !lastViewUpdateChangeSet || !trackedBindingsForNode) {
        return shouldSkip;
      }

      const intersection = new Set(
        [...lastViewUpdateChangeSet].filter((b) =>
          trackedBindingsForNode.has(b),
        ),
      );

      return intersection.size === 0;
    });

    resolver.hooks.resolveOptions.tap(CONTEXT, (options, node) => {
      if (options.validation === undefined) {
        return options;
      }

      // Clear out any old tracked bindings for this node since we're re-compiling it
      tracked.delete(node);

      /** Validation callback to track a binding */
      const track = (binding: BindingLike) => {
        const parsed = isBinding(binding)
          ? binding
          : this.options.parseBinding(binding);

        if (tracked.has(node)) {
          tracked.get(node)?.add(parsed);
        } else {
          tracked.set(node, new Set([parsed]));
        }

        /** find first parent registered as section and add self to its list */
        let { parent } = node;

        while (parent) {
          if (sections.has(parent)) {
            sections.get(parent)?.add(node);
            break;
          } else {
            parent = parent.parent;
          }
        }

        this.trackedBindings.add(parsed);
        this.options.callbacks?.onAdd?.(parsed);
      };

      return {
        ...options,
        validation: {
          ...options.validation,
          get: (binding, getOptions) => {
            if (getOptions?.track) {
              track(binding);
            }

            const eows = options.validation
              ?._getValidationForBinding(binding)
              ?.getAll(getOptions);

            const firstFieldEOW = eows?.find(
              (eow) =>
                eow.displayTarget === "field" ||
                eow.displayTarget === undefined,
            );

            return firstFieldEOW;
          },
          getValidationsForBinding(binding, getOptions) {
            if (getOptions?.track) {
              track(binding);
            }

            return (
              options.validation
                ?._getValidationForBinding(binding)
                ?.getAll(getOptions) ?? []
            );
          },
          getChildren: (type?: Validation.DisplayTarget) => {
            const validations = new Array<ValidationResponse>();
            lastComputedBindingTree.get(node)?.forEach((binding) => {
              const eow = options.validation
                ?._getValidationForBinding(binding)
                ?.get();

              if (eow && (type === undefined || type === eow.displayTarget)) {
                validations.push(eow);
              }
            });

            return validations;
          },
          getValidationsForSection: () => {
            const validations = new Array<ValidationResponse>();
            lastSectionBindingTree.get(node)?.forEach((binding) => {
              const eow = options.validation
                ?._getValidationForBinding(binding)
                ?.get();

              if (eow && eow.displayTarget === "section") {
                validations.push(eow);
              }
            });

            return validations;
          },
          register: (registerOptions) => {
            if (registerOptions?.type === "section") {
              if (!sections.has(node)) {
                sections.set(node, new Set());
              }
            }
          },
          track,
        },
      };
    });

    resolver.hooks.afterNodeUpdate.tap(
      CONTEXT,
      (originalNode, parent, update) => {
        // Compute the new tree for this node
        // If it's not-updated, use the last known value

        const { updated, node: resolvedNode } = update;
        resolvedNodeMap.set(resolvedNode, originalNode);

        if (updated) {
          const newlyComputed = new Set(tracked.get(originalNode));
          if (resolvedNode.type === NodeType.MultiNode) {
            resolvedNode.values.forEach((value) =>
              currentBindingTree
                .get(value)
                ?.forEach((b) => newlyComputed.add(b)),
            );
          }

          if ("children" in resolvedNode && resolvedNode.children) {
            resolvedNode.children.forEach((child) => {
              currentBindingTree
                .get(child.value)
                ?.forEach((b) => newlyComputed.add(b));
            });
          }

          currentBindingTree.set(resolvedNode, newlyComputed);
        } else {
          currentBindingTree.set(
            resolvedNode,
            lastComputedBindingTree.get(originalNode) ?? new Set(),
          );
        }

        if (originalNode === resolver.root) {
          this.trackedBindings = new Set(currentBindingTree.get(resolvedNode));
          lastComputedBindingTree.clear();
          currentBindingTree.forEach((value, key) => {
            const node = resolvedNodeMap.get(key);
            if (node) {
              lastComputedBindingTree.set(node, value);
            }
          });

          lastSectionBindingTree.clear();
          sections.forEach((nodeSet, sectionNode) => {
            const temp = new Set<BindingInstance>();
            nodeSet.forEach((n) => {
              tracked.get(n)?.forEach(temp.add, temp);
            });
            lastSectionBindingTree.set(sectionNode, temp);
          });

          tracked.clear();
          sections.clear();
          currentBindingTree = new Map();
        }
      },
    );
  }

  apply(view: ViewInstance) {
    view.hooks.resolver.tap(CONTEXT, this.applyResolver.bind(this));
  }
}
