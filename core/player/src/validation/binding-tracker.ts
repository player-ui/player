import type { ViewPlugin, Resolver, Node, ViewInstance } from '@player-ui/view';
import type {
  BindingInstance,
  BindingLike,
  BindingFactory,
} from '@player-ui/binding';
import { isBinding } from '@player-ui/binding';
import type { ValidationResponse } from '@player-ui/validator';
import type { Validation } from '@player-ui/types';

const CONTEXT = 'validation-binding-tracker';

export interface BindingTracker {
  /** Get the bindings currently being tracked for validation */
  getBindings(): Set<BindingInstance>;
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

  /** Attach hooks to the given resolver */
  applyResolver(resolver: Resolver) {
    this.trackedBindings.clear();

    /** Each node maps to a set of bindings that it directly tracks */
    const tracked = new Map<Node.Node, Set<BindingInstance>>();

    /** Each Node is a registered section or page that maps to a set of nodes in its section */
    const sections = new Map<Node.Node, Set<Node.Node>>();

    /** Keep track of all seen bindings so we can notify people when we hit one for the first time */
    const seenBindings = new Set<BindingInstance>();

    let lastViewUpdateChangeSet: Set<BindingInstance> | undefined;

    const nodeTree = new Map<Node.Node, Set<Node.Node>>();

    /** Map of node to all bindings in children */
    let lastComputedBindingTree = new Map<Node.Node, Set<BindingInstance>>();
    let currentBindingTree = new Map<Node.Node, Set<BindingInstance>>();

    /** Map of registered section nodes to bindings */
    const lastSectionBindingTree = new Map<Node.Node, Set<BindingInstance>>();

    /** Add the given child to the parent's tree. Create the parent entry if none exists */
    function addToTree(child: Node.Node, parent: Node.Node) {
      if (nodeTree.has(parent)) {
        nodeTree.get(parent)?.add(child);

        return;
      }

      nodeTree.set(parent, new Set([child]));
    }

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
          trackedBindingsForNode.has(b)
        )
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

        if (!seenBindings.has(parsed)) {
          seenBindings.add(parsed);
          this.options.callbacks?.onAdd?.(parsed);
        }
      };

      return {
        ...options,
        validation: {
          ...options.validation,
          get: (binding, getOptions) => {
            if (getOptions?.track) {
              track(binding);
            }

            const eow = options.validation?._getValidationForBinding(binding);

            if (
              eow?.displayTarget === undefined ||
              eow?.displayTarget === 'field'
            ) {
              return eow;
            }

            return undefined;
          },
          getChildren: (type: Validation.DisplayTarget) => {
            const validations = new Array<ValidationResponse>();
            lastComputedBindingTree.get(node)?.forEach((binding) => {
              const eow = options.validation?._getValidationForBinding(binding);

              if (eow && type === eow.displayTarget) {
                validations.push(eow);
              }
            });

            return validations;
          },
          getValidationsForSection: () => {
            const validations = new Array<ValidationResponse>();
            lastSectionBindingTree.get(node)?.forEach((binding) => {
              const eow = options.validation?._getValidationForBinding(binding);

              if (eow && eow.displayTarget === 'section') {
                validations.push(eow);
              }
            });

            return validations;
          },
          register: (registerOptions) => {
            if (registerOptions?.type === 'section') {
              if (!sections.has(node)) {
                sections.set(node, new Set());
              }
            }
          },
          track,
        },
      };
    });

    resolver.hooks.afterNodeUpdate.tap(CONTEXT, (node, parent, update) => {
      if (parent) {
        addToTree(node, parent);
      }

      // Compute the new tree for this node
      // If it's not-updated, use the last known value

      if (update.updated) {
        const newlyComputed = new Set(tracked.get(node));
        nodeTree.get(node)?.forEach((child) => {
          currentBindingTree.get(child)?.forEach((b) => newlyComputed.add(b));
        });
        currentBindingTree.set(node, newlyComputed);
      } else {
        currentBindingTree.set(
          node,
          lastComputedBindingTree.get(node) ?? new Set()
        );
      }

      if (node === resolver.root) {
        this.trackedBindings = currentBindingTree.get(node) ?? new Set();
        lastComputedBindingTree = currentBindingTree;

        lastSectionBindingTree.clear();
        sections.forEach((nodeSet, sectionNode) => {
          const temp = new Set<BindingInstance>();
          nodeSet.forEach((n) => {
            tracked.get(n)?.forEach(temp.add, temp);
          });
          lastSectionBindingTree.set(sectionNode, temp);
        });

        nodeTree.clear();
        tracked.clear();
        sections.clear();
        currentBindingTree = new Map();
      }
    });
  }

  apply(view: ViewInstance) {
    view.hooks.resolver.tap(CONTEXT, this.applyResolver.bind(this));
  }
}
