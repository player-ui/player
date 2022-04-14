/* eslint-disable @typescript-eslint/no-use-before-define */
import { Grammars } from 'ebnf';
import type {
  Parser,
  AnyNode,
  PathNode,
  ValueNode,
  ConcatenatedNode,
  QueryNode,
  ExpressionNode,
} from '../ast';
import {
  toValue,
  toQuery,
  toPath,
  toConcatenatedNode,
  toExpression,
} from '../ast';
import type {
  ValueToken,
  ModelRefToken,
  IdentifierToken,
  ConcatenatedToken,
  Token,
  OptionallyQuotedSegment,
  QueryToken,
  QuotedValueToken,
  ExpressionToken,
} from './types';

const parser = new Grammars.W3C.Parser(`
value                      ::= segment_and_bracket (SEGMENT_SEPARATOR segment_and_bracket)*
segment                    ::= concatenated | expression | modelRef | identifier  
concatenated               ::= (expression | modelRef | identifier)+ 
modelRef                   ::= OPEN_CURL OPEN_CURL value CLOSE_CURL CLOSE_CURL 
identifier                 ::= [\\w\\-@]+
query                      ::= WHITESPACE* optionally_quoted_segment WHITESPACE* EQUALS EQUALS? EQUALS? WHITESPACE* optionally_quoted_segment WHITESPACE*
brackets                   ::= OPEN_BRACKET WHITESPACE* (query | optionally_quoted_segment) WHITESPACE* CLOSE_BRACKET 
segment_and_bracket        ::= segment brackets*
quoted_value               ::= [^"']*
optionally_quoted_segment  ::= WHITESPACE* SINGLE_QUOTE quoted_value SINGLE_QUOTE WHITESPACE* | WHITESPACE* DOUBLE_QUOTE quoted_value DOUBLE_QUOTE WHITESPACE* | WHITESPACE* segment WHITESPACE*
expression_value           ::= [^\`]*
expression                 ::= BACK_TICK expression_value BACK_TICK

EQUALS                     ::= "="
SEGMENT_SEPARATOR          ::= "."
SINGLE_QUOTE               ::= "'"
DOUBLE_QUOTE               ::= '"'
WHITESPACE                 ::= " "
OPEN_CURL                  ::= "{"
CLOSE_CURL                 ::= "}" 
OPEN_BRACKET               ::= "[" 
CLOSE_BRACKET              ::= "]"
BACK_TICK                  ::= "\`" 
`);

/** Map an identifier token to a value */
function convertIdentifierToken(token: IdentifierToken): ValueNode {
  return toValue(token.text);
}

/** Concert an expression token into a node */
function convertExpressionToken(token: ExpressionToken): ExpressionNode {
  return toExpression(token.children[0].text);
}

/** map a concatenated token to a node */
function convertConcatenatedToken(
  token: ConcatenatedToken
): ConcatenatedNode | ValueNode | PathNode | ExpressionNode {
  return toConcatenatedNode(
    token.children.map((child) => {
      if (child.type === 'identifier') {
        return convertIdentifierToken(child);
      }

      if (child.type === 'expression') {
        return convertExpressionToken(child);
      }

      return convertModelRefToken(child);
    })
  );
}

/** map a quoted value token to a value node */
function convertQuotedValueToken(token: QuotedValueToken): ValueNode {
  return toValue(token.text);
}

/** map a quoted value token to a value node */
function convertOptionallyQuotedToken(
  token: OptionallyQuotedSegment
): ValueNode | ConcatenatedNode | PathNode | ExpressionNode {
  const child = token.children[0];
  if (child.type === 'quoted_value') {
    return convertQuotedValueToken(child);
  }

  const grandChild = child.children[0];
  if (grandChild.type === 'identifier') {
    return convertIdentifierToken(grandChild);
  }

  return convertConcatenatedToken(grandChild);
}

/** map a query token to a value node */
function convertQueryToken(token: QueryToken): QueryNode {
  return toQuery(
    convertOptionallyQuotedToken(token.children[0]),
    convertOptionallyQuotedToken(token.children[1])
  );
}

/** Convert the IToken */
function convertValueToken(binding: ValueToken): PathNode {
  const path: AnyNode[] = [];

  /** Expand a token into it's path refs */
  function expandPath(token: Token) {
    switch (token.type) {
      case 'modelRef':
        path.push(convertModelRefToken(token));
        break;
      case 'identifier':
        path.push(convertIdentifierToken(token));
        break;
      case 'quoted_value':
        path.push(convertQuotedValueToken(token));
        break;
      case 'expression':
        path.push(convertExpressionToken(token));
        break;
      case 'query':
        path.push(convertQueryToken(token));
        break;
      case 'concatenated':
        path.push(convertConcatenatedToken(token));
        break;
      default:
        token.children.forEach(expandPath);
    }
  }

  expandPath(binding);

  return toPath(path);
}

/** map a model ref token to a path node */
function convertModelRefToken(token: ModelRefToken): PathNode {
  return convertValueToken(token.children[0]);
}

/** Parse a binding using ebnf */
export const parse: Parser = (path) => {
  if (path === '') {
    return {
      status: true,
      path: toPath([]),
    };
  }

  const ast = parser.getAST(path) as ValueToken;

  if (!ast) {
    return {
      status: false,
      error: 'Unable to parse binding',
    };
  }

  if (ast.errors.length > 0) {
    // console.log(ast.errors);
    return {
      status: false,
      error: ast.errors[0].message,
    };
  }

  return {
    status: true,
    path: convertValueToken(ast),
  };
};
