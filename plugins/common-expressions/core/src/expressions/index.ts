import type {
  ExpressionHandler,
  ExpressionContext,
  Binding,
} from "@player-ui/player";
import { withoutContext } from "@player-ui/player";
import { toNum } from "./toNum";

/** Returns a function that executes the given function only if the first argument is a string */
function ifString(fn: (arg: string) => unknown) {
  return (arg: unknown) => {
    if (typeof arg === "string") {
      return fn(arg);
    }

    return arg;
  };
}

/** Generic Types */

export const size = withoutContext((val: unknown): number => {
  if (typeof val === "string") {
    return val.length;
  }

  if (typeof val === "object" && val !== null) {
    return Object.keys(val).length;
  }

  return 0;
});

export const length = size;

/** Checks to see if the given value is empty */
export const isEmpty: ExpressionHandler<[unknown], boolean> = (ctx, val) => {
  if (val === undefined || val === null) {
    return true;
  }

  if (typeof val === "object" || typeof val === "string") {
    return size(ctx, val) === 0;
  }

  return false;
};

/** Checks to see if the given value is not empty */
export const isNotEmpty: ExpressionHandler<[unknown], boolean> = (ctx, val) => {
  return !isEmpty(ctx, val);
};

export const concat = withoutContext((...args: Array<unknown>) => {
  if (args.every((v) => Array.isArray(v))) {
    const merged: Array<unknown> = [];

    args.forEach((next) => {
      merged.push(...next);
    });

    return merged;
  }

  return args.reduce((merged: any, next) => merged + (next ?? ""), "");
});

/** String Types */

export const trim = withoutContext(ifString((str) => str.trim()));
export const upperCase = withoutContext(ifString((str) => str.toUpperCase()));
export const lowerCase = withoutContext(ifString((str) => str.toLowerCase()));
export const replace = withoutContext(
  (str: unknown, pattern: unknown, replacement: unknown = "") => {
    if (
      typeof str === "string" &&
      typeof pattern === "string" &&
      typeof replacement === "string"
    ) {
      const replacementRegex = new RegExp(pattern, "g");

      return str.replace(replacementRegex, replacement);
    }

    return str;
  },
);
export const titleCase = withoutContext(
  ifString((str) =>
    str
      .split(" ")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" "),
  ),
);

export const sentenceCase = withoutContext(
  ifString((str) => str.replace(/\b[a-zA-Z]/, (word) => word.toUpperCase())),
);

// split: Splits a string into an array of substrings based on a separator.
// Deviations from JS:
// - If separator is undefined or null, returns the original string (JS would throw TypeError)
// - If separator is an empty string, splits at every character (matches JS)
export const split = withoutContext(
  (str: string, separator: string, limit?: number) => {
    // If separator is undefined or null, return the original string (custom: JS throws an error)
    if (separator === undefined || separator === null) {
      return str;
    }

    const separatorStr = String(separator);

    // JS behavior: empty string separator splits at every character
    if (separatorStr === "") {
      const result = str.split("");
      if (limit !== undefined && limit !== null && limit > 0) {
        return result.slice(0, limit);
      }
      return result;
    }

    // Standard JS split behavior for non-empty separator
    const result = str.split(separatorStr);

    if (limit !== undefined && limit !== null && limit > 0) {
      return result.slice(0, limit);
    }

    return result;
  },
);

// substr: Extracts a substring from a string.
// Deviations from JS:
// - Negative start index counts from the end (JS substring does not support negative indices)
// - Uses substring logic, not deprecated substr
export const substr = withoutContext(
  (str: string, start: number, length?: number) => {
    // Custom: Negative start index counts from the end (matches array behavior, not JS substring)
    const actualStartIndex = start < 0 ? str.length + start : start;

    if (length !== undefined) {
      return str.substring(actualStartIndex, actualStartIndex + length);
    }

    return str.substring(actualStartIndex);
  },
);

/** Math Types */

export const number = withoutContext(toNum);

export const round = withoutContext<[number | string], number>((num) =>
  Math.round(toNum(num, true) ?? 0),
);

export const floor = withoutContext<[number | string], number>((num) =>
  Math.floor(toNum(num, true) ?? 0),
);

export const ceil = withoutContext<[number | string], number>((num) =>
  Math.ceil(toNum(num, true) ?? 0),
);

export const sum = withoutContext<Array<number | string>, number>((...args) => {
  return args.reduce<number>((s, next) => s + (toNum(next) ?? 0), 0);
});

/** Array Operations */

/** Finds the property in an array of objects */
export const findPropertyIndex: ExpressionHandler<
  [Array<any> | Binding | undefined, string | undefined, any],
  number
> = <T = unknown>(
  context: ExpressionContext,
  bindingOrModel: Binding | Array<Record<string, T>> | undefined,
  propToCheck: string | undefined,
  valueToCheck: T,
) => {
  if (bindingOrModel === undefined) {
    return -1;
  }

  const searchArray: Array<Record<string, T>> = Array.isArray(bindingOrModel)
    ? bindingOrModel
    : context.model.get(bindingOrModel);

  if (!Array.isArray(searchArray)) {
    return -1;
  }

  return searchArray.findIndex((value) => {
    const propVal =
      typeof value === "object" && propToCheck !== undefined
        ? value[propToCheck]
        : value;

    return valueToCheck === propVal;
  });
};

/** Searches an array for an object matching the criteria. Returns the target prop from that object */
export const findProperty: ExpressionHandler<
  [Array<any> | Binding, string | undefined, any, string | undefined, any],
  any
> = <T = unknown>(
  context: ExpressionContext,
  bindingOrModel: Binding | Array<Record<string, T>>,
  propToCheck: string | undefined,
  valueToCheck: T,
  propToReturn?: string,
  defaultValue?: T,
) => {
  const searchArray: Array<Record<string, T>> = Array.isArray(bindingOrModel)
    ? bindingOrModel
    : context.model.get(bindingOrModel);

  if (!Array.isArray(searchArray)) {
    return defaultValue;
  }

  const foundValue = searchArray.find((value) => {
    const propVal =
      typeof value === "object" && propToCheck !== undefined
        ? value[propToCheck]
        : value;

    return valueToCheck === propVal;
  });

  if (foundValue === undefined) {
    return defaultValue;
  }

  if (typeof foundValue === "object" && propToReturn) {
    return foundValue[propToReturn] ?? defaultValue;
  }

  return foundValue;
};

/*
 * Checks if a given string contains any keywords present in the given array
 * @param str: The string to search in
 * @param searchStrs: A keyword(s) to search for
 # @returns boolean: Return true if any of the keywords exist in the given string
 */
export const containsAny = withoutContext<[string, string[] | string], boolean>(
  (str, keywords) => {
    if (
      !(typeof str === "string") ||
      !(typeof keywords === "string" || Array.isArray(keywords))
    ) {
      return false;
    }

    if (Array.isArray(keywords)) {
      return keywords.some((keyword) => str.indexOf(keyword) > -1);
    }

    return str.indexOf(keywords) > -1;
  },
);
