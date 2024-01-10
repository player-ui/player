import { omit, setIn } from 'timm';
import { SyncBailHook, SyncWaterfallHook } from 'tapable-ts';
import type { Template } from '@player-ui/types';
import type { AnyAssetType, Node } from './types';
import { NodeType } from './types';
import { getNodeID, hasAsync } from './utils';

export * from './types';
export * from './utils';

export const EMPTY_NODE: Node.Empty = {
  type: NodeType.Empty,
};

export interface ParseObjectOptions {
  /** how nested the templated is */
  templateDepth?: number;
}

interface NestedObj {
  /** The values of a nested local object */
  children: Node.Child[];

  value: any;
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

    determineNodeType: new SyncBailHook<[object | string], NodeType>(),

    parseNode: new SyncBailHook<
      [
        obj: object,
        nodeType: Node.ChildrenTypes,
        parseOptions: ParseObjectOptions,
        determinedNodeType: NodeType | null,
      ],
      Node.Node
    >(),
  };

  public parseView(value: AnyAssetType): Node.View {
    const viewNode = this.parseObject(value, NodeType.View);

    if (!viewNode) {
      throw new Error("Unable to parse object into a view");
    }

    return viewNode as Node.View;
  }

  private parseAsync(
    obj: object,
    type: Node.ChildrenTypes,
    options: ParseObjectOptions
  ): Node.Node | null {
    const parsedAsync = this.parseObject(omit(obj, 'async'), type, options);
    const parsedNodeId = getNodeID(parsedAsync);
    if (parsedAsync !== null && parsedNodeId) {
      return this.createASTNode(
        {
          id: parsedNodeId,
          type: NodeType.Async,
          value: parsedAsync,
        },
        obj
      );
    }

    return null;
  }

  public createASTNode(node: Node.Node | null, value: any): Node.Node | null {
    const tapped = this.hooks.onCreateASTNode.call(node, value);

    if (tapped === undefined) {
      return node;
    }

    return tapped;
  }

  /**
   * Checks if there are templated values in the object
   *
   * @param obj - The Parsed Object to check to see if we have a template array type for
   * @param localKey - The key being checked
   */
  private hasTemplateValues(obj: any, localKey: string) {
    return (
      Object.hasOwnProperty.call(obj, "template") &&
      Array.isArray(obj?.template) &&
      obj.template.length &&
      obj.template.find((tmpl: any) => tmpl.output === localKey)
    );
  }

  public parseObject(
    obj: object,
    type: Node.ChildrenTypes = NodeType.Value,
    options: ParseObjectOptions = { templateDepth: 0 },
  ): Node.Node | null {
    const nodeType = this.hooks.determineNodeType.call(obj);

    if (nodeType !== undefined) {
      const parsedNode = this.hooks.parseNode.call(
        obj,
        type,
        options,
        nodeType,
      );
      if (parsedNode) {
        return parsedNode;
      }
    }

    /**
     *
     */
    const parseLocalObject = (
      currentValue: any,
      objToParse: unknown,
      path: string[] = [],
    ): NestedObj => {
      if (typeof objToParse !== "object" || objToParse === null) {
        // value = objToParse;
        return { value: objToParse, children: [] };
      }

      const localObj = this.hooks.onParseObject.call(objToParse, type);

      if (!localObj) {
        return currentValue;
      }

      const objEntries = Array.isArray(localObj)
        ? localObj.map((v, i) => [i, v])
        : [
            ...Object.entries(localObj),
            ...Object.getOwnPropertySymbols(localObj).map((s) => [
              s,
              (localObj as any)[s],
            ]),
          ];

      const defaultValue: NestedObj = {
        children: [],
        value: currentValue,
      };

      const newValue = objEntries.reduce((accumulation, current): NestedObj => {
        const { children, ...rest } = accumulation;
        const [localKey, localValue] = current;
        if (localKey === "asset" && typeof localValue === "object") {
          const assetAST = this.parseObject(
            localValue,
            NodeType.Asset,
            options,
          );

          if (assetAST) {
            return {
              ...rest,
              children: [
                ...children,
                {
                  path: [...path, "asset"],
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
                template,
              );

              if (templateAST?.type === NodeType.MultiNode) {
                templateAST.values.forEach((v) => {
                  // eslint-disable-next-line no-param-reassign
                  v.parent = templateAST;
                });
              }

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
          } as NestedObj;
        } else if (
          localValue &&
          this.hooks.determineNodeType.call(localValue) === NodeType.Switch
        ) {
          const localSwitch = this.hooks.parseNode.call(
            localValue,
            NodeType.Value,
            options,
            NodeType.Switch,
          );

          if (
            localSwitch &&
            localSwitch.type === NodeType.Value &&
            localSwitch.children?.length === 1 &&
            localSwitch.value === undefined
          ) {
            const firstChild = localSwitch.children[0];

            return {
              ...rest,
              children: [
                ...children,
                {
                  path: [...path, localKey, ...firstChild.path],
                  value: firstChild.value,
                },
              ],
            };
          }

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
        } else if (localValue && hasAsync(localValue)) {
          const localAsync = this.parseAsync(
            localValue,
            NodeType.Value,
            options
          );
          if (localAsync) {
            children.push({
              path: [...path, localKey],
              value: localAsync,
            });
          }
        } else if (localValue && Array.isArray(localValue)) {
          const childValues = localValue
            .map((childVal) =>
              this.parseObject(childVal, NodeType.Value, options),
            )
            .filter((child): child is Node.Node => !!child);

          if (childValues.length > 0) {
            const multiNode = this.hooks.onCreateASTNode.call(
              {
                type: NodeType.MultiNode,
                override: !this.hasTemplateValues(localObj, localKey),
                values: childValues,
              },
              localValue,
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
        } else if (localValue && typeof localValue === "object") {
          const determineNodeType =
            this.hooks.determineNodeType.call(localValue);

          if (determineNodeType === NodeType.Applicability) {
            const parsedNode = this.hooks.parseNode.call(
              localValue,
              NodeType.Value,
              options,
              determineNodeType,
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
            localValue,
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
