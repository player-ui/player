import { omit, setIn } from 'timm';
import { SyncWaterfallHook } from 'tapable-ts';
import type { Template, AssetSwitch } from '@player-ui/types';
import type { Node, AnyAssetType } from './types';
import { NodeType } from './types';
import { hasSwitch, hasApplicability } from './utils';

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
  };

  public parseView(value: AnyAssetType): Node.View {
    const viewNode = this.parseObject(value, NodeType.View);

    if (!viewNode) {
      throw new Error('Unable to parse object into a view');
    }

    return viewNode as Node.View;
  }

  private parseApplicability(
    obj: object,
    type: Node.ChildrenTypes,
    options: ParseObjectOptions
  ): Node.Node | null {
    const parsedApplicability = this.parseObject(
      omit(obj, 'applicability'),
      type,
      options
    );
    if (parsedApplicability !== null) {
      const applicabilityNode = this.createASTNode(
        {
          type: NodeType.Applicability,
          expression: (obj as any).applicability,
          value: parsedApplicability,
        },
        obj
      );

      if (applicabilityNode?.type === NodeType.Applicability) {
        applicabilityNode.value.parent = applicabilityNode;
      }

      return applicabilityNode;
    }

    return null;
  }

  private parseSwitch(
    obj: AssetSwitch,
    options: ParseObjectOptions
  ): Node.Node | null {
    const dynamic = 'dynamicSwitch' in obj;
    const switchContent =
      'dynamicSwitch' in obj ? obj.dynamicSwitch : obj.staticSwitch;

    const cases: Node.SwitchCase[] = [];

    switchContent.forEach((switchCase) => {
      const { case: switchCaseExpr, ...switchBody } = switchCase;
      const value = this.parseObject(switchBody, NodeType.Value, options);

      if (value) {
        cases.push({
          case: switchCaseExpr,
          value: value as Node.Value,
        });
      }
    });

    const switchAST = this.hooks.onCreateASTNode.call(
      {
        type: NodeType.Switch,
        dynamic,
        cases,
      },
      obj
    );

    if (switchAST?.type === NodeType.Switch) {
      switchAST.cases.forEach((sCase) => {
        // eslint-disable-next-line no-param-reassign
        sCase.value.parent = switchAST;
      });
    }

    if (switchAST?.type === NodeType.Empty) {
      return null;
    }

    return switchAST ?? null;
  }

  private createASTNode(node: Node.Node | null, value: any): Node.Node | null {
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
    if (hasApplicability(obj)) {
      return this.parseApplicability(obj, type, options);
    }

    if (hasSwitch(obj)) {
      return this.parseSwitch(obj, options);
    }

    interface Obj {
      children: Node.Child[];

      value: any;
    }

    const parseLocalObj = (
      currentValue: any,
      objToParse: unknown,
      path: string[] = []
    ): Obj => {
      if (typeof objToParse !== 'object' || objToParse === null) {
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
        } else if (localKey === 'template' && Array.isArray(localValue)) {
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
        } else if (localValue && hasSwitch(localValue)) {
          const localSwitch = this.parseSwitch(localValue, options);
          
          // this was just if(localSwitch) but somehow undefined was sneaking through
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
          if (hasApplicability(localValue)) {
            const applicabilityNode = this.parseApplicability(
              localValue,
              type,
              options
            );
            if (applicabilityNode) {
              return {
                ...rest,
                children: [
                  ...children,
                  {
                    path: [...path, localKey],
                    value: applicabilityNode,
                  },
                ],
              };
            }
          } else {
            const result = parseLocalObj(accumulation.value, localValue, [
              ...path,
              localKey,
            ]);
            return {
              value: result.value,
              children: [...children, ...result.children],
            };
          }
        } else {
          const value = setIn(accumulation.value, [...path, localKey], localValue);

          return {
            children,
            value,
          };
        }
        console.log('Somehow missed the else case')
        // return accumulation
      }, defaultValue);

      return newValue;
    };

    const { value, children } = parseLocalObj(undefined, obj);

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
