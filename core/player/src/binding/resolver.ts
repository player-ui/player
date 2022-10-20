import NestedError from 'nested-error-stacks';
import type { SyncWaterfallHook } from 'tapable-ts';
import type { PathNode, AnyNode } from '../binding-grammar';

import { maybeConvertToNum } from '.';
import { findInArray } from './utils';

export interface NormalizedResult {
  /** The normalized path */
  path: Array<string | number>;

  /** Any new updates that need to happen for this binding to be resolved */
  updates?: Record<string, any>;
}

export interface ResolveBindingASTOptions {
  /** Get the value of the model at the given path */
  getValue: (path: Array<string | number>) => any;

  /** Convert the value into valid path segments */
  convertToPath: (value: any) => string;

  /** Convert the value into valid path segments */
  evaluate: (exp: string) => any;
}

export interface ResolveBindingASTHooks {
  /** A hook for transforming a node before fully resolving it */
  beforeResolveNode: SyncWaterfallHook<
    [AnyNode, Required<NormalizedResult> & ResolveBindingASTOptions]
  >;
}

/** Given a binding AST, resolve it */
export function resolveBindingAST(
  bindingPathNode: PathNode,
  options: ResolveBindingASTOptions,
  hooks?: ResolveBindingASTHooks
): NormalizedResult {
  const context: Required<NormalizedResult> = {
    updates: {},
    path: [],
  };

  // let updates: Record<string, any> = {};
  // const path: Array<string | number> = [];

  /** Get the value for any child node */
  function getValueForNode(node: AnyNode): any {
    if (node.name === 'Value') {
      return node.value;
    }

    if (node.name === 'PathNode') {
      const nestedResolvedValue = resolveBindingAST(node, options);

      if (nestedResolvedValue.updates) {
        context.updates = {
          ...context.updates,
          ...nestedResolvedValue.updates,
        };
      }

      try {
        return options.convertToPath(
          options.getValue(nestedResolvedValue.path)
        );
      } catch (e: any) {
        throw new NestedError(
          `Unable to resolve path segment: ${nestedResolvedValue.path}`,
          e
        );
      }
    }

    if (node.name === 'Expression') {
      try {
        const actualValue = options.evaluate(node.value);

        return options.convertToPath(actualValue);
      } catch (e: any) {
        throw new NestedError(`Unable to resolve path: ${node.value}`, e);
      }
    }

    throw new Error(`Unable to resolve value for node: ${node.name}`);
  }

  /** Handle when path segments are binding paths (foo.bar) or single segments (foo) */
  function appendPathSegments(segment: string | number) {
    if (typeof segment === 'string' && segment.indexOf('.') > -1) {
      segment.split('.').forEach((i) => {
        context.path.push(maybeConvertToNum(i));
      });
    } else {
      context.path.push(segment);
    }
  }

  /** Compute the _actual_ binding val from the AST */
  function resolveNode(_node: AnyNode) {
    const resolvedNode =
      hooks?.beforeResolveNode.call(_node, { ...context, ...options }) ?? _node;

    switch (resolvedNode.name) {
      case 'Expression':
      case 'PathNode':
        appendPathSegments(getValueForNode(resolvedNode));
        break;

      case 'Value':
        appendPathSegments(resolvedNode.value);
        break;

      case 'Query': {
        // Look for an object at the path with the given key/val criteria
        const objToQuery: Record<string, any>[] =
          options.getValue(context.path) ?? [];

        const { key, value } = resolvedNode;

        const resolvedKey = getValueForNode(key);
        const resolvedValue = value && getValueForNode(value);

        const index = findInArray(objToQuery, resolvedKey, resolvedValue);

        if (index === undefined || index === -1) {
          context.updates[
            [...context.path, objToQuery.length, resolvedKey].join('.')
          ] = resolvedValue;
          context.path.push(objToQuery.length);
        } else {
          context.path.push(index);
        }

        break;
      }

      case 'Concatenated':
        context.path.push(resolvedNode.value.map(getValueForNode).join(''));
        break;

      default:
        throw new Error(`Unsupported node type: ${(resolvedNode as any).name}`);
    }
  }

  bindingPathNode.path.forEach(resolveNode);

  return {
    path: context.path,
    updates:
      Object.keys(context.updates ?? {}).length > 0
        ? context.updates
        : undefined,
  };
}
