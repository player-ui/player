import { setIn } from 'timm';
import type { Expression } from '@player-ui/types';
import type { DataModelWithParser } from '../data';

const DOUBLE_OPEN_CURLY = '{{';
const DOUBLE_CLOSE_CURLY = '}}';

export interface Options {
  /** The model to use when resolving refs */
  model: DataModelWithParser;

  /** A function to evaluate an expression */
  evaluate: (exp: Expression) => any;
}

/** Search the given string for the coordinates of the next expression to resolve */
export function findNextExp(str: string) {
  const expStart = str.indexOf(DOUBLE_OPEN_CURLY);

  if (expStart === -1) {
    return undefined;
  }

  let count = 1;
  let offset = expStart + DOUBLE_OPEN_CURLY.length;
  let workingString = str.substring(expStart + DOUBLE_OPEN_CURLY.length);

  while (count > 0 && workingString.length > 0) {
    // Find the next open or close curly
    const nextCloseCurly = workingString.indexOf(DOUBLE_CLOSE_CURLY);

    // We can't close anything, so there's no point in going on with life.
    if (nextCloseCurly === -1) {
      break;
    }

    const nextOpenCurly = workingString.indexOf(DOUBLE_OPEN_CURLY);

    if (nextOpenCurly !== -1 && nextOpenCurly < nextCloseCurly) {
      // We've hit another open bracket before closing out the one we want
      // Move everything over and bump our close count by 1
      count++;
      workingString = workingString.substring(
        nextOpenCurly + DOUBLE_OPEN_CURLY.length
      );
      offset += nextOpenCurly + DOUBLE_OPEN_CURLY.length;
    } else {
      // We've hit another closing bracket
      // Decrement our count and updates offsets
      count--;
      workingString = workingString.substring(
        nextCloseCurly + DOUBLE_CLOSE_CURLY.length
      );
      offset += nextCloseCurly + DOUBLE_CLOSE_CURLY.length;
    }
  }

  if (count !== 0) {
    throw new Error(`Unbalanced {{ and }} in exp: ${str}`);
  }

  return {
    start: expStart,
    end: offset,
  };
}

/** Finds any subset of the string wrapped in @[]@ and evaluates it as an expression */
export function resolveExpressionsInString(
  val: string,
  { evaluate }: Options
): string {
  const expMatch = /@\[.*?\]@/;
  let newVal = val;
  let match = newVal.match(expMatch);

  while (match !== null) {
    const expStrWithBrackets = match[0];
    const matchStart = newVal.indexOf(expStrWithBrackets);

    const expString = expStrWithBrackets.substr(
      '@['.length,
      expStrWithBrackets.length - '@['.length - ']@'.length
    );
    const expValue = evaluate(expString);

    // The string is only the expression, return the raw value.
    if (
      matchStart === 0 &&
      expStrWithBrackets === val &&
      typeof expValue !== 'string'
    ) {
      return expValue;
    }

    newVal =
      newVal.substr(0, matchStart) +
      expValue +
      newVal.substr(matchStart + expStrWithBrackets.length);
    // remove the surrounding @[]@ to get the expression
    match = newVal.match(expMatch);
  }

  return newVal;
}

/** Return a string with all data model references resolved */
export function resolveDataRefsInString(val: string, options: Options): string {
  const { model } = options;
  let workingString = resolveExpressionsInString(val, options);

  if (
    typeof workingString !== 'string' ||
    workingString.indexOf(DOUBLE_OPEN_CURLY) === -1
  ) {
    return workingString;
  }

  while (workingString.indexOf(DOUBLE_OPEN_CURLY) !== -1) {
    const expLocation = findNextExp(workingString);

    if (!expLocation) {
      return workingString;
    }

    const { start, end } = expLocation;

    // Strip out the wrapping curlies from {{binding}} before passing to the model
    const binding = workingString
      .substring(
        start + DOUBLE_OPEN_CURLY.length,
        end - DOUBLE_OPEN_CURLY.length
      )
      .trim();

    const evaledVal = model.get(binding, { formatted: true });

    // Exit early if the string is _just_ a model lookup
    // If the result is a string, we may need further processing for nested bindings
    if (
      start === 0 &&
      end === workingString.length &&
      typeof evaledVal !== 'string'
    ) {
      return evaledVal;
    }

    workingString =
      workingString.substr(0, start) + evaledVal + workingString.substr(end);
  }

  return workingString;
}

/** Traverse the thing and replace any model refs */
function traverseObject<T>(val: T, options: Options): T {
  switch (typeof val) {
    case 'string': {
      return resolveDataRefsInString(val as string, options) as unknown as T;
    }

    case 'object': {
      if (!val) return val;
      // TODO: Do we care refs in keys?
      const keys = Object.keys(val);
      let newVal = val;

      if (keys.length > 0) {
        for (const key of keys) {
          newVal = setIn(
            newVal as any,
            [key],
            traverseObject((val as any)[key], options)
          ) as any;
        }
      }

      return newVal;
    }

    default:
      return val;
  }
}

/** Recursively resolve all model refs in whatever you pass in */
export function resolveDataRefs<T>(val: T, options: Options): T {
  return traverseObject(val, options);
}
