import type { IToken } from "ebnf";

export interface ValueToken extends IToken {
  /** A value type  */
  type: "value";

  /** Any children of the value */
  children: Array<SegmentAndBracketToken>;
}

export interface SegmentAndBracketToken extends IToken {
  /** A token for a segment + brackets */
  type: "segment_and_bracket";

  /** The segment + brackets */
  children: [SegmentToken, ...Array<BracketToken>];
}

export interface SegmentToken extends IToken {
  /** A segment token */
  type: "segment";

  /** Any children of the token */
  children: [ConcatenatedToken | IdentifierToken];
}

export interface BracketToken extends IToken {
  /** A bracket token */
  type: "bracket";
  /** Any children of the token */
  children: [OptionallyQuotedSegment | QueryToken];
}

export interface ExpressionValueToken extends IToken {
  /** Expression value token */
  type: "expression_value";

  /** No children here */
  children: [];
}

export interface ExpressionToken extends IToken {
  /** Expression token */
  type: "expression";

  /** Children is the expression value */
  children: [ExpressionValueToken];
}

export interface QuotedValueToken extends IToken {
  /** A quoted value */
  type: "quoted_value";
  /** Any children of the token */
  children: [];
}

export interface IdentifierToken extends IToken {
  /** Any identifier */
  type: "identifier";
  /** Any children of the token */
  children: [];
}

export interface ConcatenatedToken extends IToken {
  /** A node of more than 1 identifier */
  type: "concatenated";
  /** Any children of the token */
  children: Array<IdentifierToken | ModelRefToken | ExpressionToken>;
}

export interface ModelRefToken extends IToken {
  /** A nested model reference */
  type: "modelRef";
  /** Any children of the token */
  children: [ValueToken];
}

export interface OptionallyQuotedSegment extends IToken {
  /** Any optionally quoted segment */
  type: "optionally_quoted_segment";
  /** Any children of the token */
  children: [QuotedValueToken | SegmentToken];
}

export interface QueryToken extends IToken {
  /** A query */
  type: "query";
  /** Any children of the token */
  children: [OptionallyQuotedSegment, OptionallyQuotedSegment];
}

export type Token =
  | ValueToken
  | QueryToken
  | QuotedValueToken
  | OptionallyQuotedSegment
  | SegmentAndBracketToken
  | SegmentToken
  | BracketToken
  | IdentifierToken
  | ConcatenatedToken
  | ModelRefToken
  | ExpressionValueToken
  | ExpressionToken;
