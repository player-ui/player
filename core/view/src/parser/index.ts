import { setIn } from 'timm';
import { SyncBailHook, SyncWaterfallHook } from 'tapable-ts';
import type { Template } from '@player-ui/types';
import type { Node, AnyAssetType } from './types';
import { NodeType } from './types';

export * from './types';

export const EMPTY_NODE: Node.Empty = {
  type: NodeType.Empty,
};

export interface ParseObjectOptions {
  /** how nested the templated is */
  templateDepth?: number;
}

/**
 * The Parser is the way to take an incoming view from the user and parse it into an AST.
 * It provides a few ways to interact with the parsing, including mutating an object before and after creation of an AST node
 */
export class Parser {
  public readonly hooks = {
    /**
     * A hook to interact with an object _before_ parsing it into an AST
     *
     * @param value - The object we're are about to parse
     * @returns - A new value to parse.
     *  If undefined, the original value is used.
     *  If null, we stop parsing this node.
     */
    onParseObject: new SyncWaterfallHook<[object, NodeType]>(),

    /**
     * A callback to interact with an AST _after_ we parse it into the AST
     *
     * @param value - The object we parsed
     * @param node - The AST node we generated
     * @returns - A new AST node to use
     *   If undefined, the original value is used.
     *   If null, we ignore this node all together
     */
    onCreateASTNode: new SyncWaterfallHook<
      [Node.Node | undefined | null, object]
    >(),

    determineNodeType: new SyncBailHook<[object], NodeType>(),

    parseNode: new SyncBailHook<
      [object | null, NodeType | null, ParseObjectOptions],
      Node.Node
    >(),
  };

  public parseView(value: AnyAssetType): Node.View {
    const viewNode = this.parseObject(value, NodeType.View);

    if (!viewNode) {
      throw new Error('Unable to parse object into a view');
    }

    return viewNode as Node.View;
  }

  public createASTNode(node: Node.Node | null, value: any): Node.Node | null {
    const tapped = this.hooks.onCreateASTNode.call(node, value);

    if (tapped === undefined) {
      return node;
    }

    return tapped;
  }

  public parseObject(
    obj: object,
    type: Node.ChildrenTypes = NodeType.Value,
    options: ParseObjectOptions = { templateDepth: 0 }
  ): Node.Node | null {
    const nodeType = this.hooks.determineNodeType.call(obj);

    if (nodeType !== undefined) {
      const parsedNode = this.hooks.parseNode.call(obj, nodeType, options);
      if (parsedNode) {
        return parsedNode;
      }
    }
    // let value: any;
    // let children: Node.Child[] = [];

    interface Obj {
      children: Node.Child[];

      value: any;
    }

    const parseLocalObject = (
      currentValue: any,
      objToParse: unknown,
      path: string[] = []
    ): Obj => {
      if (typeof objToParse !== 'object' || objToParse === null) {
        // value = objToParse;
        return { value: objToParse, children: [] };
      }

      const localObj = this.hooks.onParseObject.call(objToParse, type);

      if (!localObj) {
        return currentValue;
      }

      const objEntries = Array.isArray(localObj)
        ? localObj.map((v, i) => [i, v])
        : Object.entries(localObj);

      const defaultValue: Obj = {
        children: [],
        value: currentValue,
      };

      const newValue = objEntries.reduce((accumulation, current): Obj => {
        const { children, ...rest } = accumulation;
        const [localKey, localValue] = current;
        if (localKey === 'asset' && typeof localValue === 'object') {
          const assetAST = this.parseObject(
            localValue,
            NodeType.Asset,
            options
          );

          if (assetAST) {
            return {
              ...rest,
              children: [
                ...children,
                {
                  path: [...path, 'asset'],
                  value: assetAST,
                },
              ],
            };
          }
        } else if (
          this.hooks.determineNodeType.call(localKey) === NodeType.Template &&
          Array.isArray(localValue)
        ) {
          const templateChildren = localValue
            .map((template: Template) => {
              const templateAST = this.hooks.onCreateASTNode.call(
                {
                  type: NodeType.Template,
                  depth: options.templateDepth ?? 0,
                  data: template.data,
                  template: template.value,
                  dynamic: template.dynamic ?? false,
                },
                template
              );

              if (templateAST) {
                return {
                  path: [...path, template.output],
                  value: templateAST,
                };
              }

              // eslint-disable-next-line no-useless-return
              return;
            })
            .filter((element) => !!element);

          return {
            ...rest,
            children: [...children, ...templateChildren],
          } as Obj;
        } else if (
          localValue &&
          this.hooks.determineNodeType.call(localValue) === NodeType.Switch
        ) {
          const localSwitch = this.hooks.parseNode.call(
            localValue,
            NodeType.Switch,
            options
          );

          if (localSwitch) {
            return {
              ...rest,
              children: [
                ...children,
                {
                  path: [...path, localKey],
                  value: localSwitch,
                },
              ],
            };
          }
        } else if (localValue && Array.isArray(localValue)) {
          const childValues = localValue
            .map((childVal) =>
              this.parseObject(childVal, NodeType.Value, options)
            )
            .filter((child): child is Node.Node => !!child);

          if (childValues.length > 0) {
            const multiNode = this.hooks.onCreateASTNode.call(
              {
                type: NodeType.MultiNode,
                override: true,
                values: childValues,
              },
              localValue
            );

            if (multiNode?.type === NodeType.MultiNode) {
              multiNode.values.forEach((v) => {
                // eslint-disable-next-line no-param-reassign
                v.parent = multiNode;
              });
            }

            if (multiNode) {
              return {
                ...rest,
                children: [
                  ...children,
                  {
                    path: [...path, localKey],
                    value: multiNode,
                  },
                ],
              };
            }
          }
        } else if (localValue && typeof localValue === 'object') {
          const determineNodeType =
            this.hooks.determineNodeType.call(localValue);

          if (determineNodeType === NodeType.Applicability) {
            const parsedNode = this.hooks.parseNode.call(
              localValue,
              NodeType.Applicability,
              options
            );
            if (parsedNode) {
              return {
                ...rest,
                children: [
                  ...children,
                  {
                    path: [...path, localKey],
                    value: parsedNode,
                  },
                ],
              };
            }
          } else {
            const result = parseLocalObject(accumulation.value, localValue, [
              ...path,
              localKey,
            ]);
            return {
              value: result.value,
              children: [...children, ...result.children],
            };
          }
        } else {
          const value = setIn(
            accumulation.value,
            [...path, localKey],
            localValue
          );

          return {
            children,
            value,
          };
        }

        return accumulation;
      }, defaultValue);

      return newValue;
    };

    const { value, children } = parseLocalObject(undefined, obj);

    const baseAst =
      value === undefined && children.length === 0
        ? undefined
        : {
            type,
            value,
          };

    if (baseAst !== undefined && children.length > 0) {
      const parent = baseAst as Node.BaseWithChildren<any>;
      parent.children = children;
      children.forEach((child) => {
        // eslint-disable-next-line no-param-reassign
        child.value.parent = parent;
      });
    }

    return this.hooks.onCreateASTNode.call(baseAst, obj) ?? null;
  }
}
