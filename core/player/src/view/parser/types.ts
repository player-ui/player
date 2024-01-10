import type { Asset as AssetType, Expression, Binding } from "@player-ui/types";

export type AnyAssetType = AssetType<string>;
export enum NodeType {
  Asset = 'asset',
  View = 'view',
  Applicability = 'applicability',
  Template = 'template',
  Value = 'value',
  MultiNode = 'multi-node',
  Switch = 'switch',
  Async = 'async',
  Unknown = 'unknown',
  Empty = 'empty',
}
export declare namespace Node {
  export type ChildrenTypes = NodeType.Asset | NodeType.Value | NodeType.View;

  export interface Base<T extends NodeType> {
    /** Every node contains a type to distinguish it from other nodes */
    type: T;

    /** Every node (outside of the root) contains a reference to it's parent */
    parent?: Node;
  }

  export type PathSegment = string | number;

  export interface Child {
    /** The path of the child relative to the parent */
    path: PathSegment[];

    /** If true, the path points to an array, and the value will be appended to it result */
    array?: boolean;

    /** The child node */
    value: Node;
  }

  export interface BaseWithChildren<T extends NodeType> extends Base<T> {
    /** Any node that contains a list of children underneath it */
    children?: Child[];
  }

  export interface Asset<T extends AnyAssetType = AnyAssetType>
    extends BaseWithChildren<NodeType.Asset>,
      PluginOptions {
    /** Any asset nested within a view */
    value: T;
  }

  export interface View<T extends AnyAssetType = AnyAssetType>
    extends BaseWithChildren<NodeType.View>,
      PluginOptions {
    /** The root of the parsed view */
    value: T;
  }

  export interface Applicability extends Base<NodeType.Applicability> {
    /** The expression to execute that determines applicability of the target node */
    expression: Expression;

    /** The node to use if the expression is truthy */
    value: Node;
  }

  export interface Template extends Base<NodeType.Template> {
    /** The location of an array in the model */
    data: Binding;

    /** The template to use when mapping over the data */
    template: unknown;

    /** The number of nested templates so far */
    depth: number;

    /** should the template recomputed when data changes */
    dynamic?: boolean;
  }

  export interface Value
    extends BaseWithChildren<NodeType.Value>,
      PluginOptions {
    /** A simple node representing a value */
    value: any;
  }

  export interface MultiNode extends Base<NodeType.MultiNode> {
    /**
     * Should this list override the target node if they overlap?
     * If not amend the existing list
     */
    override?: boolean;

    /** A list of values that comprise this node */
    values: Array<Node>;
  }

  export interface Switch extends Base<NodeType.Switch> {
    /** Should this list be re-computed when data changes */
    dynamic?: boolean;

    /** A list of cases to evaluate in order */
    cases: SwitchCase[];
  }

  export interface SwitchCase {
    /** The expression to evaluate for a single case statement */
    case: Expression | true;
    /** The value to use if this case is true */
    value: Value;
  }

  export interface Async extends Base<NodeType.Async> {
    /** The unique id of the node */
    id: string;
    /** The value representing the node */
    value: Node;
  }

  export interface PluginOptions {
    /** A list of plugins */
    plugins?: {
      /** StringResolverPlugin options */
      stringResolver?: {
        /**
         * An optional array of node properties to skip during string resolution
         * Specified in the AssetTransformPlugin
         */
        propertiesToSkip?: string[];
      };
    };
  }

  export type Unknown = Base<NodeType.Unknown>;
  export type Empty = Base<NodeType.Empty>;
  export type ViewOrAsset = View | Asset;

  export type Node =
    | Asset
    | Applicability
    | Template
    | Value
    | View
    | MultiNode
    | Switch
    | Async
    | Unknown
    | Empty;
}
