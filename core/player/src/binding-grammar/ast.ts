export interface Node<T extends string> {
  /** The basic node type */
  name: T;
}

/**
 * An AST node that represents a nested path in the model
 * foo.{{bar}}.baz (this is {{bar}})
 */
export interface PathNode extends Node<"PathNode"> {
  /** The path in the model that this node represents */
  path: Array<AnyNode>;
}

/**
 * A segment representing a query
 * [foo=bar]
 */
export interface QueryNode extends Node<"Query"> {
  /** The key to query */
  key: AnyNode;

  /** The target value */
  value?: AnyNode;
}

/** A simple segment */
export interface ValueNode extends Node<"Value"> {
  /** The segment value */
  value: string | number | boolean;
}

/** A nested expression */
export interface ExpressionNode extends Node<"Expression"> {
  /** The expression */
  value: string;
}

/** Helper to create a value node */
export const toValue = (value: string | number | boolean): ValueNode => ({
  name: "Value",
  value,
});

/** Helper to create an expression node */
export const toExpression = (value: string): ExpressionNode => ({
  name: "Expression",
  value,
});

/** Helper to create a nested path node */
export const toPath = (path: Array<AnyNode>): PathNode => ({
  name: "PathNode",
  path,
});

/** Helper to create a query node */
export const toQuery = (key: AnyNode, value?: AnyNode): QueryNode => ({
  name: "Query",
  key,
  value,
});

/** Create a concat node */
export const toConcatenatedNode = (
  values: Array<PathNode | ValueNode | ExpressionNode>,
): PathNode | ValueNode | ConcatenatedNode | ExpressionNode => {
  if (values.length === 1) {
    return values[0];
  }

  return {
    name: "Concatenated",
    value: values,
  };
};

/**
 * A binding segment that's multiple smaller ones
 * {{foo}}_bar_{{baz}}
 */
export interface ConcatenatedNode extends Node<"Concatenated"> {
  /** A list of nested paths, or value nodes to concat together to form a segment */
  value: Array<PathNode | ValueNode | ExpressionNode>;
}

export type AnyNode =
  | PathNode
  | QueryNode
  | ValueNode
  | ConcatenatedNode
  | ExpressionNode;
export type Path = Array<AnyNode>;

export interface ParserSuccessResult {
  /** A successful parse result */
  status: true;

  /** The path the binding represents */
  path: PathNode;
}

export interface ParserFailureResult {
  /** A failed parse result */
  status: false;

  /** The message representing the reason the parse result failed */
  error: string;
}

export type ParserResult = ParserSuccessResult | ParserFailureResult;

export type Parser = (raw: string) => ParserResult;
