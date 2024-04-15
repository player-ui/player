import { set } from "timm";
import { resolveDataRefs } from "../../string-resolver";
import type { Options } from "./options";
import type { Node } from "../parser";
import { NodeType } from "../parser";
import type { Resolver } from "../resolver";
import { ViewInstance, ViewPlugin } from "../view";

/** Create a function that checks for a start/end sequence in a string */
const createPatternMatcher = (start: string, end: string) => {
  return (testStr: string) => {
    const startLocation = testStr.indexOf(start);

    if (startLocation === -1) {
      return false;
    }

    const endLocation = testStr.indexOf(end);

    if (endLocation === -1) {
      return false;
    }

    return startLocation < endLocation;
  };
};

const bindingResolveLookup = createPatternMatcher("{{", "}}");
const expressionResolveLookup = createPatternMatcher("@[", "]@");

/** Check to see if a string contains a reference to dynamic content */
function hasSomethingToResolve(str: string) {
  return bindingResolveLookup(str) || expressionResolveLookup(str);
}

/** Resolve data refs in a string if necessary. */
function resolveString(str: string, resolveOptions: Options) {
  return hasSomethingToResolve(str)
    ? resolveDataRefs(str, {
        model: resolveOptions.data.model,
        evaluate: resolveOptions.evaluate,
      })
    : str;
}

/** Recursively resolve all string references in an object or array */
export function resolveAllRefs(
  node: any,
  resolveOptions: Options,
  propertiesToSkip: Set<string | number>,
): any {
  if (
    node === null ||
    node === undefined ||
    (typeof node !== "object" && typeof node !== "string")
  ) {
    return node;
  }

  if (typeof node === "string") {
    return resolveString(node, resolveOptions);
  }

  let newNode = node;

  Object.keys(node).forEach((key: string | number) => {
    if (propertiesToSkip.has(key)) {
      return;
    }

    const val = node[key];

    let newVal = val;

    if (typeof val === "object") {
      newVal = resolveAllRefs(val, resolveOptions, propertiesToSkip);
    } else if (typeof val === "string") {
      newVal = resolveString(val, resolveOptions);
    }

    if (newVal !== val) {
      newNode = set(newNode, key as any, newVal);
    }
  });

  return newNode;
}

/** Traverse up the node tree finding the first available 'path' */
const findBasePath = (
  node: Node.Node,
  resolver: Resolver,
): Node.PathSegment[] => {
  const parentNode = node.parent;
  if (!parentNode) {
    return [];
  }

  if ("children" in parentNode) {
    const original = resolver.getSourceNode(node);
    return (
      parentNode.children?.find((child) => child.value === original)?.path ?? []
    );
  }

  if (parentNode.type !== NodeType.MultiNode) {
    return [];
  }

  return findBasePath(parentNode, resolver);
};

/** A plugin that resolves all string references for each node */
export default class StringResolverPlugin implements ViewPlugin {
  private propertiesToSkipCache: Map<string, Set<string>>;

  constructor() {
    this.propertiesToSkipCache = new Map();
  }

  applyResolver(resolver: Resolver) {
    resolver.hooks.resolve.tap("string-resolver", (value, node, options) => {
      if (node.type === NodeType.Empty || node.type === NodeType.Unknown) {
        return null;
      }

      if (
        node.type === NodeType.Value ||
        node.type === NodeType.Asset ||
        node.type === NodeType.View
      ) {
        /** Use specified properties to skip during string resolution, or default */
        let propsToSkip: Set<string>;
        if (node.type === NodeType.Asset || node.type === NodeType.View) {
          propsToSkip = new Set(
            node.plugins?.stringResolver?.propertiesToSkip ?? ["exp"],
          );
          if (node.value?.id) {
            this.propertiesToSkipCache.set(node.value.id, propsToSkip);
          }
        } else if (
          node.parent?.type === NodeType.MultiNode &&
          (node.parent?.parent?.type === NodeType.Asset ||
            node.parent?.parent?.type === NodeType.View) &&
          node.parent.parent.value?.id &&
          this.propertiesToSkipCache.has(node.parent.parent.value.id)
        ) {
          propsToSkip = this.propertiesToSkipCache.get(
            node.parent.parent.value.id,
          ) as Set<string>;
        } else {
          propsToSkip = new Set(["exp"]);
        }

        const nodePath = findBasePath(node, resolver);

        /** If the path includes something that is supposed to be skipped, this node should be skipped too. */
        if (
          nodePath.length > 0 &&
          nodePath.some((segment) => propsToSkip.has(segment.toString()))
        ) {
          return node.value;
        }

        return resolveAllRefs(node.value, options, propsToSkip);
      }

      return value;
    });
  }

  apply(view: ViewInstance) {
    view.hooks.resolver.tap("string-resolver", this.applyResolver.bind(this));
  }
}
