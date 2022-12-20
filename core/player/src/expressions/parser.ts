/* eslint @typescript-eslint/no-use-before-define: 0 */
/**
 * An expression to AST parser based on JSEP: http://jsep.from.so/
 */
import type { ExpressionNode, ExpressionNodeType, NodeLocation } from './types';
import { ExpNodeOpaqueIdentifier } from './types';

const PERIOD_CODE = 46; // '.'
const COMMA_CODE = 44; // ','
const SQUOTE_CODE = 39; // Single quote
const DQUOTE_CODE = 34; // Double quotes
const OPAREN_CODE = 40; // (
const CPAREN_CODE = 41; // )
const OBRACK_CODE = 91; // [
const CBRACK_CODE = 93; // ]
const QUMARK_CODE = 63; // ?
const SEMCOL_CODE = 59; // ;
const COLON_CODE = 58; // :
const OCURL_CODE = 123; // {
const CCURL_CODE = 125; // }

// Operations
// ----------

// Set `t` to `true` to save space (when minified, not gzipped)
const t = true;

// Use a quickly-accessible map to store all of the unary operators
// Values are set to `true` (it really doesn't matter)
const unaryOps = { '-': t, '!': t, '~': t, '+': t };

// Also use a map for the binary operations but set their values to their
// binary precedence for quick reference:
// see [Operator precedence](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence)
const binaryOps: Record<string, number> = {
  '=': 3,
  '+=': 3,
  '-=': 3,
  '&=': 3,
  '|=': 3,
  // Conditional: 4,
  '||': 5,
  '&&': 6,
  '|': 7,
  '^': 8,
  '&': 9,
  '==': 10,
  '!=': 10,
  '===': 10,
  '!==': 10,
  '<': 11,
  '>': 11,
  '<=': 11,
  '>=': 11,
  '<<': 12,
  '>>': 12,
  '>>>': 12,
  '+': 13,
  '-': 13,
  '*': 14,
  '/': 14,
  '%': 14,
};

interface ErrorWithLocation extends Error {
  /** The place in the string where the error occurs */
  index: number;

  /** a helpful description */
  description: string;
}

/** Wrap the message and index in an error and throw it */
function throwError(message: string, index: number) {
  const err = new Error(`${message} at character ${index}`);

  (err as ErrorWithLocation).index = index;
  (err as ErrorWithLocation).description = message;

  throw err;
}

/** Create a new location marker that spans both nodes */
function createSpanningLocation(start?: NodeLocation, end?: NodeLocation) {
  if (!start || !end) {
    return;
  }

  return {
    start: start.start,
    end: end.end,
  };
}

/** Get return the longest key length of any object */
function getMaxKeyLen(obj: object): number {
  let maxLen = 0;

  Object.keys(obj).forEach((key) => {
    if (key.length > maxLen && Object.prototype.hasOwnProperty.call(obj, key)) {
      maxLen = key.length;
    }
  });

  return maxLen;
}

const maxUnopLen = getMaxKeyLen(unaryOps);
const maxBinopLen = getMaxKeyLen(binaryOps);

// Literals
// ----------
// Store the values to return for the various literals we may encounter
const literals = {
  true: true,
  false: false,
  null: null,
  undefined,
} as const;

// Except for `this`, which is special. This could be changed to something like `'self'` as well
const thisStr = 'this';

/** Returns the precedence of a binary operator or `0` if it isn't a binary operator */
function binaryPrecedence(opVal: string): number {
  return binaryOps[opVal] || 0;
}

/**
 * Utility function (gets called from multiple places)
 * Also note that `a && b` and `a || b` are *logical* expressions, not binary expressions
 */
function createBinaryExpression(
  operator: string | boolean,
  left: string,
  right: string,
  location?: NodeLocation
) {
  let type: ExpressionNodeType;

  if (operator === '||' || operator === '&&') {
    type = 'LogicalExpression';
  } else if (operator === '=') {
    type = 'Assignment';
  } else if (
    operator === '+=' ||
    operator === '-=' ||
    operator === '&=' ||
    operator === '|='
  ) {
    type = 'Modification';
  } else {
    type = 'BinaryExpression';
  }

  return {
    __id: ExpNodeOpaqueIdentifier,
    type,
    operator,
    left,
    right,
    location,
  };
}

/** `ch` is a character code in the next three functions */
function isDecimalDigit(ch: number) {
  return ch >= 48 && ch <= 57; // 0...9
}

/** Check if the char is the character code for the start of an identifier */
function isIdentifierStart(ch: number) {
  return (
    ch === 36 ||
    ch === 95 || // `$` and `_`
    (ch >= 65 && ch <= 90) || // A...Z
    (ch >= 97 && ch <= 122)
  ); // A...z
}

/** Check if the char code is still a valid identifier portion */
function isIdentifierPart(ch: number) {
  return (
    ch === 36 ||
    ch === 95 || // `$` and `_`
    (ch >= 65 && ch <= 90) || // A...Z
    (ch >= 97 && ch <= 122) || // A...z
    (ch >= 48 && ch <= 57)
  ); // 0...9
}

/** Check if the 2 chars are the start of a model reference */
function isModelRefStart(ch0: number, ch1: number) {
  return ch0 === OCURL_CODE && ch1 === OCURL_CODE; // '{{'
}

/** Parse out an expression from the string */
export default function parseExpression(expr: string): ExpressionNode {
  // `index` stores the character number we are currently at while `length` is a constant
  // All of the gobbles below will modify `index` as we move along
  const charAtFunc = expr.charAt;
  const charCodeAtFunc = expr.charCodeAt;
  const { length } = expr;

  let index = 0;

  /** Create a location object  */
  const getLocation = (startChar: number) => {
    return {
      start: {
        character: startChar,
      },
      end: {
        character: index,
      },
    };
  };

  /** Grab the char at the index from the expression */
  function exprI(i: number) {
    return charAtFunc.call(expr, i);
  }

  /** Grab the unicode char at the index in the expression */
  function exprICode(i: number) {
    return charCodeAtFunc.call(expr, i);
  }

  /**
   * Gobble an object and store the object in an attributes array
   */
  function gobbleObjects() {
    const attributes: Array<{
      /** The property name of the object */
      key: any;

      /** the associated value */
      value: any;
    }> = [];
    let closed = false;

    let shouldDefineKey = true;
    let key;
    let value;
    let chCode;
    const startCharIndex = index;

    // get rid of OCURL_CODE
    ++index;

    while (index < length) {
      gobbleSpaces();
      chCode = exprICode(index);
      // check for end
      if (chCode === CCURL_CODE) {
        // if we are at the end but a key was defined
        if (key) {
          throwError('A key was defined but a value was not', index);
        }

        index++;
        closed = true;
        break;
      } else if (shouldDefineKey) {
        // check for key
        if (chCode !== SQUOTE_CODE && chCode !== DQUOTE_CODE) {
          throwError('An object must start wtih a key', index);
        }

        // get key
        key = gobbleStringLiteral();
        // remove spaces
        gobbleSpaces();
        // remove colon
        if (exprICode(index) === COLON_CODE) {
          index++;
          shouldDefineKey = false;
        } else {
          throwError('A colon must follow an object key', index);
        }
      } else {
        value = gobbleExpression();

        attributes.push({ key, value });
        gobbleSpaces();
        chCode = exprICode(index);
        if (chCode === COMMA_CODE) {
          index++;
        } else if (chCode !== CCURL_CODE) {
          throwError('Please add a comma to add another key', index);
        }

        shouldDefineKey = true;
        key = undefined;
        value = undefined;
      }

      chCode = exprICode(index);
    }

    // throw error if object is not closed
    if (!closed) {
      throwError(`Unclosed brace in object`, index);
    }

    return {
      __id: ExpNodeOpaqueIdentifier,
      type: 'Object',
      attributes,
      location: getLocation(startCharIndex),
    };
  }

  /**
   * Push `index` up to the next non-space character
   */
  function gobbleSpaces() {
    let ch = exprICode(index);
    // Space or tab
    while (ch === 32 || ch === 9) {
      ch = exprICode(++index);
    }
  }

  /**
   * The main parsing function. Much of this code is dedicated to ternary expressions
   */
  function gobbleExpression(): ExpressionNode {
    const test = gobbleBinaryExpression();
    gobbleSpaces();
    const startCharIndex = index;

    if (index < length && exprICode(index) === QUMARK_CODE) {
      // Ternary expression: test ? consequent : alternate
      index++;
      const consequent = gobbleExpression();

      if (!consequent) {
        throwError('Expected expression', index);
      }

      gobbleSpaces();

      if (exprICode(index) === COLON_CODE) {
        index++;
        const alternate = gobbleExpression();

        if (!alternate) {
          throwError('Expected expression', index);
        }

        return {
          __id: ExpNodeOpaqueIdentifier,
          type: 'ConditionalExpression',
          test,
          consequent,
          alternate,
          location: getLocation(startCharIndex),
        };
      }

      throwError('Expected :', index);
    }

    return test;
  }

  /**
   * Search for the operation portion of the string (e.g. `+`, `===`)
   * Start by taking the longest possible binary operations (3 characters: `===`, `!==`, `>>>`)
   * and move down from 3 to 2 to 1 character until a matching binary operation is found
   * then, return that binary operation
   */
  function gobbleBinaryOp() {
    gobbleSpaces();

    let toCheck = expr.substr(index, maxBinopLen);
    let tcLen = toCheck.length;

    while (tcLen > 0) {
      if (Object.prototype.hasOwnProperty.call(binaryOps, toCheck)) {
        index += tcLen;
        return toCheck;
      }

      toCheck = toCheck.substr(0, --tcLen);
    }

    return false;
  }

  /**
   * This function is responsible for gobbling an individual expression,
   * e.g. `1`, `1+2`, `a+(b*2)-Math.sqrt(2)`
   */
  function gobbleBinaryExpression() {
    let node;
    let prec;
    let i;

    // First, try to get the leftmost thing
    // Then, check to see if there's a binary operator operating on that leftmost thing
    let left = gobbleToken();
    let biop = gobbleBinaryOp();

    // If there wasn't a binary operator, just return the leftmost node
    if (!biop) {
      return left;
    }

    // Otherwise, we need to start a stack to properly place the binary operations in their
    // precedence structure
    let biopInfo = { value: biop, prec: binaryPrecedence(biop) };
    let right = gobbleToken();

    if (!right) {
      throwError(`Expected expression after ${biop}`, index);
    }

    const stack = [left, biopInfo, right];

    // Properly deal with precedence using [recursive descent](http://www.engr.mun.ca/~theo/Misc/exp_parsing.htm)
    biop = gobbleBinaryOp();
    while (biop) {
      prec = binaryPrecedence(biop);

      if (prec === 0) {
        break;
      }

      biopInfo = { value: biop, prec };

      // Reduce: make a binary expression from the three topmost entries.
      while (stack.length > 2 && prec <= stack[stack.length - 2].prec) {
        right = stack.pop();
        biop = stack.pop().value;
        left = stack.pop();
        node = createBinaryExpression(
          biop,
          left,
          right,
          createSpanningLocation(left.location, right.location)
        );
        stack.push(node);
      }

      node = gobbleToken();

      if (!node) {
        throwError(`Expected expression after ${biop}`, index);
      }

      stack.push(biopInfo, node);
      biop = gobbleBinaryOp();
    }

    i = stack.length - 1;
    node = stack[i];

    while (i > 1) {
      node = createBinaryExpression(
        stack[i - 1].value,
        stack[i - 2],
        node,
        createSpanningLocation(stack[i - 2].location, node.location)
      );
      i -= 2;
    }

    return node;
  }

  /**
   * An individual part of a binary expression:
   * e.g. `foo.bar(baz)`, `1`, `"abc"`, `(a % 2)` (because it's in parenthesis)
   */
  function gobbleToken(): any {
    gobbleSpaces();
    const ch = exprICode(index);
    const startCharIndex = index;

    if (isDecimalDigit(ch) || ch === PERIOD_CODE) {
      // Char code 46 is a dot `.` which can start off a numeric literal
      return gobbleNumericLiteral();
    }

    if (ch === SQUOTE_CODE || ch === DQUOTE_CODE) {
      // Single or double quotes
      return gobbleStringLiteral();
    }

    if (isIdentifierStart(ch) || ch === OPAREN_CODE) {
      // Open parenthesis
      // `foo`, `bar.baz`
      return gobbleVariable();
    }

    if (ch === OBRACK_CODE) {
      return gobbleArray();
    }

    if (isModelRefStart(ch, exprICode(index + 1))) {
      return gobbleModelRef();
    }

    // not a double bracket: {{}} but if its a single {}
    if (ch === OCURL_CODE) {
      return gobbleObjects();
    }

    let toCheck = expr.substr(index, maxUnopLen);
    let tcLen = toCheck.length;

    while (tcLen > 0) {
      if (Object.prototype.hasOwnProperty.call(unaryOps, toCheck)) {
        index += tcLen;
        return {
          __id: ExpNodeOpaqueIdentifier,
          type: 'UnaryExpression',
          operator: toCheck,
          argument: gobbleToken(),
          prefix: true,
          location: getLocation(startCharIndex),
        };
      }

      toCheck = toCheck.substr(0, --tcLen);
    }

    return false;
  }

  /**
   * Parse simple numeric literals: `12`, `3.4`, `.5`. Do this by using a string to
   * keep track of everything in the numeric literal and then calling `parseFloat` on that string
   */
  function gobbleNumericLiteral() {
    let num = '';
    const startCharIndex = index;

    while (isDecimalDigit(exprICode(index))) {
      num += exprI(index++);
    }

    if (exprICode(index) === PERIOD_CODE) {
      // Can start with a decimal marker
      num += exprI(index++);

      while (isDecimalDigit(exprICode(index))) {
        num += exprI(index++);
      }
    }

    let ch = exprI(index);
    if (ch === 'e' || ch === 'E') {
      // Exponent marker
      num += exprI(index++);
      ch = exprI(index);

      if (ch === '+' || ch === '-') {
        // Exponent sign
        num += exprI(index++);
      }

      while (isDecimalDigit(exprICode(index))) {
        // Exponent itself
        num += exprI(index++);
      }

      if (!isDecimalDigit(exprICode(index - 1))) {
        throwError(`Expected exponent (${num}${exprI(index)})`, index);
      }
    }

    const chCode = exprICode(index);
    // Check to make sure this isn't a variable name that start with a number (123abc)
    if (isIdentifierStart(chCode)) {
      throwError(
        `Variable names cannot start with a number (${num}${exprI(index)})`,
        index
      );
    } else if (chCode === PERIOD_CODE) {
      throwError('Unexpected period', index);
    }

    return {
      __id: ExpNodeOpaqueIdentifier,
      type: 'Literal',
      value: parseFloat(num),
      raw: num,
      location: getLocation(startCharIndex),
    };
  }

  /**
   * Parses a string literal, staring with single or double quotes with basic support for escape codes
   * e.g. `"hello world"`, `'this is\nJSEP'`
   */
  function gobbleStringLiteral() {
    const quote = exprI(index++);
    let str = '';
    let closed = false;
    const startCharIndex = index;

    while (index < length) {
      let ch = exprI(index++);

      if (ch === quote) {
        closed = true;
        break;
      }

      if (ch !== '\\') {
        str += ch;
        continue;
      }

      // Check for all of the common escape codes
      ch = exprI(index++);

      switch (ch) {
        case 'n':
          str += '\n';
          break;
        case 'r':
          str += '\r';
          break;
        case 't':
          str += '\t';
          break;
        case 'b':
          str += '\b';
          break;
        case 'f':
          str += '\f';
          break;
        case 'v':
          str += '\u000B';
          break;
        default:
      }
    }

    if (!closed) {
      throwError(`Unclosed quote after "${str}"`, index);
    }

    return {
      __id: ExpNodeOpaqueIdentifier,
      type: 'Literal',
      value: str,
      raw: `${quote}${str}${quote}`,
      location: getLocation(startCharIndex),
    };
  }

  /**
   * Model refs are bindings wrapped in 2 sets of double curlys
   * e.g. {{foo.bar.ref}}
   */
  function gobbleModelRef() {
    let str = '';
    let closed = false;
    let openBraceCount = 1;
    const startCharIndex = index;

    index += 2; // Skip the {{
    while (index < length) {
      const ch = exprI(index++);

      if (ch === '}' && exprICode(index) === CCURL_CODE) {
        index++;
        openBraceCount--;

        if (openBraceCount === 0) {
          closed = true;
          break;
        }

        str += '}}';
      } else if (ch === '{' && exprICode(index) === OCURL_CODE) {
        openBraceCount++;
        str += '{{';
        index++;
      } else {
        str += ch;
      }
    }

    if (!closed) {
      throwError(`Unclosed brace after "${str}"`, index);
    }

    return {
      __id: ExpNodeOpaqueIdentifier,
      type: 'ModelRef',
      ref: str,
      location: getLocation(startCharIndex),
    };
  }

  /**
   * Gobbles only identifiers
   * e.g.: `foo`, `_value`, `$x1`
   * Also, this function checks if that identifier is a literal:
   * (e.g. `true`, `false`, `null`) or `this`
   */
  function gobbleIdentifier() {
    const start = index;
    let ch = exprICode(start);

    if (isIdentifierStart(ch)) {
      index++;
    } else {
      throwError(`Unexpected ${exprI(index)}`, index);
    }

    while (index < length) {
      ch = exprICode(index);
      if (isIdentifierPart(ch)) {
        index++;
      } else {
        break;
      }
    }

    const identifier = expr.slice(start, index);

    if (Object.prototype.hasOwnProperty.call(literals, identifier)) {
      return {
        __id: ExpNodeOpaqueIdentifier,
        type: 'Literal',
        value: (literals as any)[identifier],
        raw: identifier,
        location: getLocation(start),
      };
    }

    if (identifier === thisStr) {
      return {
        __id: ExpNodeOpaqueIdentifier,
        type: 'ThisExpression',
        location: getLocation(start),
      };
    }

    return {
      __id: ExpNodeOpaqueIdentifier,
      type: 'Identifier',
      name: identifier,
      location: getLocation(start),
    };
  }

  /**
   * Gobbles a list of arguments within the context of a function call
   * or array literal. This function also assumes that the opening character
   * `(` or `[` has already been gobbled, and gobbles expressions and commas
   * until the terminator character `)` or `]` is encountered.
   * e.g. `foo(bar, baz)`, `my_func()`, or `[bar, baz]`
   */
  function gobbleArguments(termination: number) {
    const args = [];
    let charIndex;
    let node;

    while (index < length) {
      gobbleSpaces();
      charIndex = exprICode(index);

      if (charIndex === termination) {
        // Done parsing
        index++;
        break;
      }

      if (charIndex === COMMA_CODE) {
        // Between expressions
        index++;
        continue;
      }

      node = gobbleExpression();

      if (!node || node.type === 'Compound') {
        throwError('Expected comma', index);
      }

      args.push(node);
    }

    return args;
  }

  /**
   * Gobble a non-literal variable name. This variable name may include properties
   * e.g. `foo`, `bar.baz`, `foo['bar'].baz`
   * It also gobbles function calls:
   * e.g. `Math.acos(obj.angle)`
   */
  function gobbleVariable(): ExpressionNode {
    let charIndex = exprICode(index);
    let node: any =
      charIndex === OPAREN_CODE ? gobbleGroup() : gobbleIdentifier();
    const startCharIndex = index;
    gobbleSpaces();
    charIndex = exprICode(index);

    while (
      charIndex === PERIOD_CODE ||
      charIndex === OBRACK_CODE ||
      charIndex === OPAREN_CODE
    ) {
      index++;

      if (charIndex === PERIOD_CODE) {
        gobbleSpaces();

        node = {
          __id: ExpNodeOpaqueIdentifier,
          type: 'MemberExpression',
          computed: false,
          object: node,
          property: gobbleIdentifier(),
          location: getLocation(startCharIndex),
        };
      } else if (charIndex === OBRACK_CODE) {
        node = {
          __id: ExpNodeOpaqueIdentifier,
          type: 'MemberExpression',
          computed: true,
          object: node,
          property: gobbleExpression(),
          location: getLocation(startCharIndex),
        };

        gobbleSpaces();
        charIndex = exprICode(index);

        if (charIndex !== CBRACK_CODE) {
          throwError('Unclosed [', index);
        }

        index++;
      } else if (charIndex === OPAREN_CODE) {
        // A function call is being made; gobble all the arguments
        node = {
          __id: ExpNodeOpaqueIdentifier,
          type: 'CallExpression',
          args: gobbleArguments(CPAREN_CODE),
          callTarget: node,
          location: getLocation(startCharIndex),
        };
      }

      gobbleSpaces();
      charIndex = exprICode(index);
    }

    return node;
  }

  /**
   * Responsible for parsing a group of things within parentheses `()`
   * This function assumes that it needs to gobble the opening parenthesis
   * and then tries to gobble everything within that parenthesis, assuming
   * that the next thing it should see is the close parenthesis. If not,
   * then the expression probably doesn't have a `)`
   */
  function gobbleGroup() {
    index++;
    const node = gobbleExpression();
    gobbleSpaces();

    if (exprICode(index) === CPAREN_CODE) {
      index++;
      return node;
    }

    throwError('Unclosed (', index);
  }

  /**
   * Responsible for parsing Array literals `[1, 2, 3]`
   * This function assumes that it needs to gobble the opening bracket
   * and then tries to gobble the expressions as arguments.
   */
  function gobbleArray() {
    const startCharIndex = index;
    index++;

    return {
      __id: ExpNodeOpaqueIdentifier,
      type: 'ArrayExpression',
      elements: gobbleArguments(CBRACK_CODE),
      location: getLocation(startCharIndex),
    };
  }

  const nodes = [];

  while (index < length) {
    const chIndex = exprICode(index);

    // Expressions can be separated by semicolons, commas, or just inferred without any
    // separators
    if (chIndex === SEMCOL_CODE || chIndex === COMMA_CODE) {
      index++; // ignore separators
      continue;
    }

    const node = gobbleExpression();

    // Try to gobble each expression individually
    if (node) {
      nodes.push(node);
      // If we weren't able to find a binary expression and are out of room, then
      // the expression passed in probably has too much
    } else if (index < length) {
      throwError(`Unexpected "${exprI(index)}"`, index);
    }
  }

  // If there's only one expression just try returning the expression
  if (nodes.length === 1) {
    return nodes[0];
  }

  return {
    __id: ExpNodeOpaqueIdentifier,
    type: 'Compound',
    body: nodes,
    location: getLocation(0),
  };
}
