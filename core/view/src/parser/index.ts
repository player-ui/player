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
    let value: any;
    let children: Node.Child[] = [];

    const parseLocalObject = (objToParse: unknown, path: string[] = []) => {
      if (typeof objToParse !== 'object' || objToParse === null) {
        value = objToParse;
        return;
      }

      const localObj = this.hooks.onParseObject.call(objToParse, type);

      if (!localObj) {
        return;
      }

      const objEntries = Array.isArray(localObj)
        ? localObj.map((v, i) => [i, v])
        : Object.entries(localObj);

      objEntries.forEach(([localKey, localValue]) => {
        if (localKey === 'asset' && typeof localValue === 'object') {
          const assetAST = this.parseObject(
            localValue,
            NodeType.Asset,
            options
          );

          if (assetAST) {
            children = [
              ...children,
              { path: [...path, 'asset'], value: assetAST },
            ];
          }
        } else if (
          this.hooks.determineNodeType.call(localKey) === NodeType.Template &&
          Array.isArray(localValue)
        ) {
          localValue.forEach((template: Template) => {
            const templateAST = this.hooks.parseNode.call(
              template,
              NodeType.Template,
              options
            );
            if (templateAST) {
              children = [
                ...children,
                {
                  path: [...path, template.output],
                  value: templateAST,
                },
              ];
            }
          });
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
            children = [
              ...children,
              {
                path: [...path, localKey],
                value: localSwitch,
              },
            ];
          }
        } else if (localValue && Array.isArray(localValue)) {
          const childValues: Node.Node[] = [];

          localValue.forEach((childVal) => {
            const parsedChild = this.parseObject(
              childVal,
              NodeType.Value,
              options
            );

            if (parsedChild) {
              childValues.push(parsedChild);
            }
          });

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
              children = [
                ...children,
                {
                  path: [...path, localKey],
                  value: multiNode,
                },
              ];
            }
          }
        } else if (localValue && typeof localValue === 'object') {
          const determineNodeType =
            this.hooks.determineNodeType.call(localValue);

          if (determineNodeType === NodeType.Applicability) {
            const parseNode = this.hooks.parseNode.call(
              localValue,
              NodeType.Applicability,
              options
            );
            if (parseNode) {
              children = [
                ...children,
                {
                  path: [...path, localKey],
                  value: parseNode,
                },
              ];
            }
          } else {
            parseLocalObject(localValue, [...path, localKey]);
          }
        } else {
          value = setIn(value, [...path, localKey], localValue);
        }
      });
    };

    parseLocalObject(obj);

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
