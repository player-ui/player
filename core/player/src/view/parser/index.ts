import { setIn } from "timm";
import { SyncBailHook, SyncWaterfallHook } from "tapable-ts";
import type { AnyAssetType, Node } from "./types";
import { NodeType } from "./types";
import { Builder } from "../builder";

export * from "./types";
export * from "./utils";

export const EMPTY_NODE: Node.Empty = {
  type: NodeType.Empty,
};

export interface ParseObjectOptions {
  /** how nested the templated is */
  templateDepth?: number;
}

export interface ParseObjectChildOptions {
  key: string;
  path: Node.PathSegment[];
  parentObj: object;
}

export type ParserHooks = {
  /**
   * A hook to interact with an object _before_ parsing it into an AST
   *
   * @param value - The object we're are about to parse
   * @returns - A new value to parse.
   *  If undefined, the original value is used.
   *  If null, we stop parsing this node.
   */
  onParseObject: SyncWaterfallHook<[object, NodeType]>;
  /**
   * A callback to interact with an AST _after_ we parse it into the AST
   *
   * @param value - The object we parsed
   * @param node - The AST node we generated
   * @returns - A new AST node to use
   *   If undefined, the original value is used.
   *   If null, we ignore this node all together
   */
  onCreateASTNode: SyncWaterfallHook<[Node.Node | undefined | null, object]>;
  /** A hook to call when parsing an object into an AST node
   *
   * @param obj - The object we're are about to parse
   * @param nodeType - The type of node we're parsing
   * @param parseOptions - Additional options when parsing
   * @param childOptions - Additional options that are populated when the node being parsed is a child of another node
   * @returns - A new AST node to use
   *   If undefined, the original value is used.
   *   If null, we ignore this node all together
   */
  parseNode: SyncBailHook<
    [
      obj: object,
      nodeType: Node.ChildrenTypes,
      parseOptions: ParseObjectOptions,
      childOptions?: ParseObjectChildOptions,
    ],
    Node.Node | Node.Child[]
  >;
};

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
  public readonly hooks: ParserHooks = {
    onParseObject: new SyncWaterfallHook(),
    onCreateASTNode: new SyncWaterfallHook(),
    parseNode: new SyncBailHook(),
  };

  public parseView(value: AnyAssetType): Node.View {
    const viewNode = this.parseObject(value, NodeType.View);

    if (!viewNode) {
      throw new Error("Unable to parse object into a view");
    }

    return viewNode as Node.View;
  }

  public parseMultiNode(
    nodes: Array<object>,
    options: ParseObjectOptions = { templateDepth: 0 },
  ): Node.Node | null {
    const parsedNode = this.hooks.parseNode.call(
      nodes,
      NodeType.Value,
      options,
    ) as Node.Node | null;

    if (parsedNode || parsedNode === null) {
      return parsedNode;
    }

    const values = nodes
      .map((item) => this.parseObject(item, NodeType.Value, options))
      .filter(
        (child): child is Node.Value | Node.Applicability | Node.Async =>
          !!child,
      );

    return Builder.multiNode(...values);
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
    options: ParseObjectOptions = { templateDepth: 0 },
  ): Node.Node | null {
    const parsedNode = this.hooks.parseNode.call(
      obj,
      type,
      options,
    ) as Node.Node | null;

    if (parsedNode || parsedNode === null) {
      return parsedNode;
    }

    const parseLocalObject = (
      currentValue: any,
      objToParse: unknown,
      path: string[] = [],
    ): NestedObj => {
      if (typeof objToParse !== "object" || objToParse === null) {
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
        let { value } = accumulation;
        const { children } = accumulation;
        const [localKey, localValue] = current;

        const newChildren = this.hooks.parseNode.call(
          localValue,
          NodeType.Value,
          options,
          {
            path,
            key: localKey,
            parentObj: localObj,
          },
        ) as Node.Child[];

        if (newChildren) {
          children.push(...newChildren);
        } else if (localValue && typeof localValue === "object") {
          const result = parseLocalObject(accumulation.value, localValue, [
            ...path,
            localKey,
          ]);

          value = result.value;
          children.push(...result.children);
        } else {
          value = setIn(accumulation.value, [...path, localKey], localValue);
        }

        return {
          value,
          children,
        };
      }, defaultValue);

      return newValue;
    };

    const { value, children } = parseLocalObject(undefined, obj);

    const baseAst =
      value === undefined && !children.length
        ? undefined
        : {
            type,
            value,
          };

    if (baseAst && children.length) {
      const parent: Node.BaseWithChildren<any> = baseAst;
      parent.children = children;
      children.forEach((child) => {
        child.value.parent = parent;
      });
    }

    return this.hooks.onCreateASTNode.call(baseAst, obj) ?? null;
  }
}
