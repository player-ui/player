import { resolveDataRefs } from "@player-ui/player";
import type { ValidatorFunction, Expression } from "@player-ui/player";

// Shamelessly lifted from Scott Gonzalez via the Bassistance Validation plugin http://projects.scottsplayground.com/email_address_validation/

const EMAIL_REGEX =
  // eslint-disable-next-line no-control-regex
  /^((([a-z]|\d|[!#$%&'*+\-/=?^_`{|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#$%&'*+-/=?^_`{|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i;
const PHONE_REGEX = /^\+?[1]?[- ]?\(?\d{3}[)\- ]?\s?\d{3}[ -]?\d{4}$/;
const ZIP_REGEX = /^\d{5}(-\d{4})?$/;

/** Skip any null or undefined value when running the validator */
function skipNullish<T>(
  validationFn: ValidatorFunction<T>,
): ValidatorFunction<T> {
  return (context, value, options) => {
    if (value === null || value === undefined) {
      return;
    }

    return validationFn(context, value, options);
  };
}

/** Checks to see if the data-type is a string */
export const string: ValidatorFunction = skipNullish((context, value) => {
  if (typeof value !== "string") {
    const message = context.constants.getConstants(
      "validation.string",
      "constants",
      "Value must be a string",
    ) as string;

    return {
      message,
      parameters: {
        type: typeof value,
      },
    };
  }
});

/** Validation for a non-mutable property */
export const readonly: ValidatorFunction = (context) => {
  const message = context.constants.getConstants(
    "validation.readonly",
    "constants",
    "Value cannot be modified",
  ) as string;

  return { message };
};

/** Check to see if the value represents an array of items */
export const collection: ValidatorFunction = skipNullish((context, value) => {
  if (!Array.isArray(value)) {
    const message = context.constants.getConstants(
      "validation.collection",
      "constants",
      "Cannot set collection to non-array",
    ) as string;

    return { message };
  }
});

/** Checks to see if the value is an integer */
export const integer: ValidatorFunction = skipNullish((context, value) => {
  if (
    value &&
    (typeof value !== "number" ||
      Math.floor(value) !== value ||
      Number(value) > Number.MAX_SAFE_INTEGER ||
      Number(value) < Number.MIN_SAFE_INTEGER)
  ) {
    const message = context.constants.getConstants(
      "validation.integer",
      "constants",
      "Value must be an integer",
    ) as string;

    return {
      message,
      parameters: {
        type: typeof value,
        flooredValue: Math.floor(value),
      },
    };
  }
});

/** An enum check to see if the value is in a provided list of acceptable options */
export const oneOf: ValidatorFunction<{
  /** The enum values that are acceptable  */
  options: Array<unknown>;
}> = skipNullish((context, value, options) => {
  if (options?.options === undefined || options.options?.includes(value)) {
    return;
  }

  const message = context.constants.getConstants(
    "validation.oneOf",
    "constants",
    "Invalid entry",
  ) as string;

  return { message };
});

/** A validator that evaluates an expression for validation */
export const expression: ValidatorFunction<{
  /**
   * The expression to evaluate.
   * Falsy values indicate an invalid response
   */
  exp: Expression;
}> = (context, value, options?) => {
  if (options?.exp === undefined) {
    context.logger.warn("No expression defined for validation");

    return;
  }

  const result = context.evaluate(options.exp);

  if (!result) {
    const message = context.constants.getConstants(
      "validation.expression",
      "constants",
      "Expression evaluation failed",
    ) as string;

    return { message };
  }
};

/** A validator that requires a non-null value */
export const required: ValidatorFunction<{
  /** An optional expression to limit the required check only if true */
  if?: Expression;

  /** An optional expression to limit the required check only if false */
  ifNot?: Expression;
}> = (context, value, options) => {
  if (
    (options?.if && !context.evaluate(options.if)) ||
    (options?.ifNot && context.evaluate(options.ifNot))
  ) {
    // Skipping due to if check
    return;
  }

  if (value === undefined || value === null || value === "") {
    const message = context.constants.getConstants(
      "validation.required",
      "constants",
      "A value is required",
    ) as string;

    return { message, severity: "error" };
  }
};

/** A validator that uses a regular expression */
export const regex: ValidatorFunction<{
  /**
   * The regular expression to test: /pattern/
   * Can optionally include flags after the pattern: /pattern/flags
   */
  regex: string;
}> = skipNullish((context, value, options) => {
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    typeof options?.regex !== "string"
  ) {
    return;
  }

  const resolvedRegex = resolveDataRefs(options.regex, context);
  // Split up /pattern/flags into [pattern, flags]
  const patternMatch = resolvedRegex.match(/^\/(.*)\/(\w)*$/);

  const regexp = patternMatch
    ? new RegExp(patternMatch[1], patternMatch[2])
    : new RegExp(resolvedRegex);

  if (!regexp.test(value)) {
    const message = context.constants.getConstants(
      "validation.regex",
      "constants",
      "Invalid entry",
    ) as string;

    return { message };
  }
});

/** Checks the length of a value  */
export const length: ValidatorFunction<
  | {
      /** The minimum length to check against  */
      min?: number;

      /** The maximum length to check against  */
      max?: number;
    }
  | {
      /** The exact length to match against */
      exact: number;
    }
> = skipNullish((context, value, options) => {
  if (typeof options !== "object") {
    context.logger.warn("Missing comparison in length validation");

    return;
  }

  let valLength: number | undefined;
  let itemName = "items";

  if (typeof value === "string") {
    valLength = value.length;
    itemName = "characters";
  } else if (typeof value === "object" && value !== null) {
    valLength = Object.keys(value).length;
  }

  if (valLength === undefined) {
    context.logger.warn(
      `Unable to determine a length for value of type: ${value}`,
    );

    return;
  }

  if ("exact" in options) {
    if (valLength !== options.exact) {
      return {
        message: `Must be exactly ${options.exact} ${itemName} long`,
        parameters: {
          validationLength: valLength,
        },
      };
    }

    return;
  }

  if (options.min !== undefined && valLength < options.min) {
    const message = context.constants.getConstants(
      "validation.length.minimum",
      "constants",
      `At least ${options.min} ${itemName} needed`,
    ) as string;

    return {
      message,
      parameters: {
        validationLength: valLength,
      },
    };
  }

  if (options.max !== undefined && valLength > options.max) {
    const message = context.constants.getConstants(
      "validation.length.maximum",
      "constants",
      `Up to ${options.max} ${itemName} allowed`,
    ) as string;

    return {
      message,
      parameters: {
        validationLength: valLength,
      },
    };
  }
});

/**
 * Checks that the given value is at least the expected one
 */
export const min: ValidatorFunction<{
  /** The minimum value */
  value: number;
}> = skipNullish((context, value, options) => {
  if (typeof value !== "number" || options?.value === undefined) {
    return;
  }

  if (value < options.value) {
    const message = context.constants.getConstants(
      "validation.min",
      "constants",
      `Must be at least ${options.value}`,
    ) as string;

    return { message };
  }
});

/**
 * Checks that the given value is at least the expected one
 */
export const max: ValidatorFunction<{
  /** The minimum value */
  value: number;
}> = skipNullish((context, value, options) => {
  if (typeof value !== "number" || options?.value === undefined) {
    return;
  }

  if (value > options.value) {
    const message = context.constants.getConstants(
      "validation.max",
      "constants",
      `Cannot exceed ${options.value}`,
    ) as string;

    return { message };
  }
});

/** Create a validator using a regular expression */
const stringRegexValidator = (
  test: RegExp,
  messagePath: string,
  invalidMessage: string,
): ValidatorFunction => {
  return skipNullish((context, value) => {
    if (typeof value === "string" && value === "") {
      return;
    }

    if (typeof value !== "string" || !test.test(value)) {
      const message = context.constants.getConstants(
        messagePath,
        "constants",
        invalidMessage,
      ) as string;

      return { message };
    }
  });
};

/** Checks that the given value represents an email */
export const email = stringRegexValidator(
  EMAIL_REGEX,
  "validation.email",
  "Improper email format",
);

/** Checks that the given value represents a phone number */
export const phone = stringRegexValidator(
  PHONE_REGEX,
  "validation.phone",
  "Invalid phone number",
);

/** Checks that the given value represents a phone number */
export const zip = stringRegexValidator(
  ZIP_REGEX,
  "validation.regex",
  "Invalid zip code",
);
