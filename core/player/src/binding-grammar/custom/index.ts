import type {
  Parser,
  AnyNode,
  PathNode,
  ConcatenatedNode,
  ValueNode,
  QueryNode,
  ExpressionNode,
} from '../ast';
import {
  toValue,
  toPath,
  toConcatenatedNode,
  toQuery,
  toExpression,
} from '../ast';

const SEGMENT_SEPARATOR = '.';
const OPEN_CURL = '{';
const CLOSE_CURL = '}';
const OPEN_BRACKET = '[';
const CLOSE_BRACKET = ']';
const EQUALS = '=';
const SINGLE_QUOTE = "'";
const DOUBLE_QUOTE = '"';
const BACK_TICK = '`';
// const IDENTIFIER_REGEX = /[\w\-@]+/;

/** A _faster_ way to match chars instead of a regex. */
const isIdentifierChar = (char?: string): boolean => {
  if (!char) {
    return false;
  }

  const charCode = char.charCodeAt(0);

  const matches =
    charCode === 32 || // ' '
    charCode === 34 || // "
    charCode === 39 || // '
    charCode === 40 || // (
    charCode === 41 || // )
    charCode === 42 || // *
    charCode === 46 || // .
    charCode === 61 || // =
    charCode === 91 || // [
    charCode === 93 || // ]
    charCode === 96 || // `
    charCode === 123 || // {
    charCode === 125; // }

  return !matches;
};

/** Parse out a binding AST from a path */
export const parse: Parser = (path) => {
  let index = 1;
  let ch = path.charAt(0);

  /** get the next char in the string */
  const next = (expected?: string) => {
    if (expected && ch !== expected) {
      throw new Error(`Expected char: ${expected} but got: ${ch}`);
    }

    ch = path.charAt(index);
    index += 1;
    // console.log(`Index: ${index} Char: ${ch}`);
    return ch;
  };

  /** gobble all whitespace */
  const whitespace = () => {
    /* eslint-disable no-unmodified-loop-condition */
    while (ch === ' ') {
      next();
    }
  };

  /** get an identifier if you can */
  const identifier = (): ValueNode | undefined => {
    if (!isIdentifierChar(ch)) {
      return;
    }

    let value = ch;

    while (next()) {
      if (!isIdentifierChar(ch)) {
        break;
      }

      value += ch;
    }

    if (value) {
      return toValue(value);
    }
  };

  /** get an expression node if you can */
  const expression = (): ExpressionNode | undefined => {
    if (ch === BACK_TICK) {
      next(BACK_TICK);

      let exp = ch;

      while (next()) {
        if (ch === BACK_TICK) {
          break;
        }

        exp += ch;
      }

      next(BACK_TICK);

      if (exp) {
        return toExpression(exp);
      }
    }
  };

  /** Grab a value using a regex */
  const regex = (match: RegExp): ValueNode | undefined => {
    if (!ch?.match(match)) {
      return;
    }

    let value = ch;

    while (next()) {
      if (!ch?.match(match)) {
        break;
      }

      value += ch;
    }

    if (value) {
      return toValue(value);
    }
  };

  /** parse out a nestedPath if you can */
  const nestedPath = (): PathNode | undefined => {
    if (ch === OPEN_CURL) {
      next(OPEN_CURL);
      if (ch === OPEN_CURL) {
        next(OPEN_CURL);

        /* eslint-disable-next-line @typescript-eslint/no-use-before-define */
        const modelRef = parsePath();
        next(CLOSE_CURL);
        next(CLOSE_CURL);
        return modelRef;
      }
    }
  };

  /** get a simple segment node */
  const simpleSegment = () => nestedPath() ?? expression() ?? identifier();

  /** Parse a segment */
  const segment = ():
    | ConcatenatedNode
    | PathNode
    | ValueNode
    | ExpressionNode
    | undefined => {
    // Either a string, modelRef, or concatenated version (both)
    const segments: Array<ValueNode | PathNode | ExpressionNode> = [];
    let nextSegment = simpleSegment();

    while (nextSegment !== undefined) {
      segments.push(nextSegment);
      nextSegment = simpleSegment();
    }

    if (segments.length === 0) {
      return undefined;
    }

    return toConcatenatedNode(segments);
  };

  /** get an optionally quoted block */
  const optionallyQuotedSegment = ():
    | ValueNode
    | PathNode
    | ExpressionNode
    | undefined => {
    whitespace();

    // see if we have a quote

    if (ch === SINGLE_QUOTE || ch === DOUBLE_QUOTE) {
      const singleQuote = ch === SINGLE_QUOTE;
      next(singleQuote ? SINGLE_QUOTE : DOUBLE_QUOTE);
      const id = regex(/[^'"]+/);
      next(singleQuote ? SINGLE_QUOTE : DOUBLE_QUOTE);
      return id;
    }

    return simpleSegment();
  };

  /** eat equals signs */
  const equals = (): boolean => {
    if (ch !== EQUALS) {
      return false;
    }

    while (ch === EQUALS) {
      next();
    }

    return true;
  };

  /** Parse out a bracket */
  const parseBracket = ():
    | ValueNode
    | QueryNode
    | PathNode
    | ExpressionNode
    | undefined => {
    if (ch === OPEN_BRACKET) {
      next(OPEN_BRACKET);
      whitespace();
      let value: ValueNode | QueryNode | PathNode | ExpressionNode | undefined =
        optionallyQuotedSegment();
      if (value) {
        whitespace();
        if (equals()) {
          whitespace();
          const second = optionallyQuotedSegment();
          value = toQuery(value, second);
          whitespace();
        }
      } else {
        throw new Error(`Expected identifier`);
      }

      if (value) {
        next(CLOSE_BRACKET);
      }

      return value;
    }
  };

  /** Parse a segment and any number of brackets following it */
  const parseSegmentAndBrackets = (): Array<AnyNode> => {
    // try to parse a segment first

    const parsed: Array<AnyNode> = [];

    const firstSegment = segment();

    if (firstSegment) {
      parsed.push(firstSegment);

      let bracketSegment = parseBracket();

      while (bracketSegment !== undefined) {
        parsed.push(bracketSegment);
        bracketSegment = parseBracket();
      }
    }

    return parsed;
  };

  /** Parse out a path segment */
  const parsePath = (): PathNode => {
    const parts: AnyNode[] = [];

    let nextSegment = parseSegmentAndBrackets();

    while (nextSegment !== undefined) {
      parts.push(...nextSegment);

      if (!ch || ch === CLOSE_CURL) {
        break;
      }

      if (nextSegment.length === 0 && ch) {
        throw new Error(`Unexpected character: ${ch}`);
      }

      next(SEGMENT_SEPARATOR);
      nextSegment = parseSegmentAndBrackets();
    }

    return toPath(parts);
  };

  try {
    const result = parsePath();

    return {
      status: true,
      path: result,
    };
  } catch (e: any) {
    return {
      status: false,
      error: e.message,
    };
  }
};
