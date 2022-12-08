import type { DataModelWithParser } from '../data';
import type { Logger } from '../logger';

export type ExpressionLiteralType =
  | string
  | number
  | boolean
  | undefined
  | null;
export type ExpressionType =
  | object
  | ExpressionLiteralType
  | Array<ExpressionLiteralType>
  | ExpressionNode;

export interface OperatorProcessingOptions {
  /**
   * When set to a falsy value, the arguments passed to the handler will be raw AST Nodes
   * This enables lazy evaluation of arguments
   */
  resolveParams: boolean;
}

export type BinaryOperatorBasic = (left: any, right: any) => unknown;
export type BinaryOperatorAdvanced = OperatorProcessingOptions &
  ((ctx: ExpressionContext, left: any, right: any) => unknown);

export type BinaryOperator = BinaryOperatorAdvanced | BinaryOperatorBasic;

export type UnaryOperator =
  | ((arg: any) => unknown)
  | (((ctx: ExpressionContext, arg: any) => unknown) &
      OperatorProcessingOptions);

export interface ExpressionContext {
  /** A means of executing an expression */
  evaluate: (expr: ExpressionType) => unknown;

  /** The data model that expression handlers can use when fetching data */
  model: DataModelWithParser;

  /** A logger to use */
  logger?: Logger;
}

export type ExpressionHandler<
  T extends readonly unknown[] = unknown[],
  R = void
> = ((context: ExpressionContext, ...args: T) => R) &
  Partial<OperatorProcessingOptions>;

export const ExpNodeOpaqueIdentifier = Symbol('Expression Node ID');

/** Checks if the input is an already processed Expression node */
export function isExpressionNode(x: any): x is ExpressionNode {
  return typeof x === 'object' && x.__id === ExpNodeOpaqueIdentifier;
}

export interface NodePosition {
  /** The character location */
  character: number;
}

export interface NodeLocation {
  // We only care about the character offset, not the line/column for now
  // But making these objects allows us to add more (like line number) later

  /** The start of the node */
  start: NodePosition;

  /** The end of the node */
  end: NodePosition;
}

export interface BaseNode<T> {
  /** The thing to discriminate the AST type on */
  type: T;

  /** How to tell this apart from other objects */
  __id: typeof ExpNodeOpaqueIdentifier;

  /** The location of the node in the source expression string */
  location?: NodeLocation;
}

/** A helper interface for nodes that container left and right children */
export interface DirectionalNode {
  /** The left node. Often for the left hand side of an expression */
  left: ExpressionNode;

  /** The right child. Often for the right hand side of an expression */
  right: ExpressionNode;
}

export interface LiteralNode extends BaseNode<'Literal'> {
  /** A node that holds a literal value */
  value: string | number;

  /** The unprocessed value */
  raw?: any;
}

export interface BinaryNode
  extends BaseNode<'BinaryExpression'>,
    DirectionalNode {
  /** The operation to perform on the nodes */
  operator: string;
}

export interface LogicalNode
  extends BaseNode<'LogicalExpression'>,
    DirectionalNode {
  /** The logical operation to perform on the nodes */
  operator: string;
}

export interface UnaryNode extends BaseNode<'UnaryExpression'> {
  /** The operation to perform on the node */
  operator: string;

  /** The single argument that the operation should be performed on */
  argument: ExpressionNode;
}

export type ThisNode = BaseNode<'ThisExpression'>;

export interface ModelRefNode extends BaseNode<'ModelRef'> {
  /** The binding that the model reference points to */
  ref: string;
}

export interface ObjectNode extends BaseNode<'Object'> {
  /**  */
  attributes: Array<{
    /** The property name of the object */
    key: ExpressionNode;

    /** the associated value */
    value: ExpressionNode;
  }>;
}

export interface MemberExpressionNode extends BaseNode<'MemberExpression'> {
  /** The object to be introspected */
  object: ExpressionNode;

  /** If the property uses . or open-bracket */
  computed: boolean;

  /** The property to access on the object */
  property: ExpressionNode;
}

export interface ConditionalExpressionNode
  extends BaseNode<'ConditionalExpression'> {
  /** The test for the ternary */
  test: ExpressionNode;

  /** The truthy case for the ternary */
  consequent: ExpressionNode;

  /** The falsy case for the ternary */
  alternate: ExpressionNode;
}

export interface CompoundNode extends BaseNode<'Compound'> {
  /** The contents of the compound expression */
  body: ExpressionNode[];
}

export interface CallExpressionNode extends BaseNode<'CallExpression'> {
  /** The arguments to the function */
  args: ExpressionNode[];

  /** The function name */
  callTarget: IdentifierNode;
}

export interface ArrayExpressionNode extends BaseNode<'ArrayExpression'> {
  /** The items in an array */
  elements: ExpressionNode[];
}

export interface IdentifierNode extends BaseNode<'Identifier'> {
  /** The variable name */
  name: string;
}

export type AssignmentNode = BaseNode<'Assignment'> & DirectionalNode;

export interface ModificationNode
  extends BaseNode<'Modification'>,
    DirectionalNode {
  /** The operator for the modification */
  operator: string;
}

export type ExpressionNode =
  | LiteralNode
  | BinaryNode
  | LogicalNode
  | UnaryNode
  | ThisNode
  | ModelRefNode
  | MemberExpressionNode
  | ConditionalExpressionNode
  | CompoundNode
  | CallExpressionNode
  | ArrayExpressionNode
  | IdentifierNode
  | AssignmentNode
  | ModificationNode
  | ObjectNode;

export type ExpressionNodeType = ExpressionNode['type'];
