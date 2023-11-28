import type { FormatType } from "@player-ui/player";

export const PLACEHOLDER = "#";

/**
 * Remove any formatting characters in the 'mask' from 'value'
 *
 * @param value - The string to remove the control characters from
 * @param mask - The mask to use and test against
 * @param reserved - The reserved _slots_ (these are the chars that you expect new values to be subbed into)
 *
 * @example
 * removeFormatCharactersFromMaskedString('123-456', '###-###', ['#']) => '123456'
 */
export const removeFormatCharactersFromMaskedString = (
  value: string,
  mask: string,
  reserved: string[] = [PLACEHOLDER],
): string => {
  const reservedMatchesLength = mask
    .split("")
    .filter((val) => reserved.includes(val)).length;
  let replacements = 0;

  return value.split("").reduce((newString, nextChar, nextIndex) => {
    const maskedVal = mask[nextIndex];

    if (maskedVal === undefined) {
      return newString;
    }

    if (reservedMatchesLength === replacements) {
      return newString;
    }

    if (reserved.includes(maskedVal)) {
      replacements++;
      return newString + nextChar;
    }

    /**
     * Characters will match when the incoming value is formatted, but in cases
     * where it's being pulled from the model and deformatted again, ensure we
     * don't skip over characters.
     */
    if (maskedVal !== nextChar) {
      replacements++;
      return newString + nextChar;
    }

    return newString;
  }, "");
};

/**
 * Format the given string using one of the accepted values
 * Optionally, the value can be choose to ignore case when formatting, or to autocomplete if only 1 option is viable
 * If no such option is viable, undefined is returned
 */
export const formatAsEnum = (
  value: string,
  acceptedValues: string[],
  options?: {
    /** Ignore the case of the provided value when comparing to the acceptedValues */
    ignoreCase?: boolean;

    /** If only 1 option is viable, autocomplete the value to the accepted one */
    autocomplete?: boolean;
  },
): string | undefined => {
  const autoCompletionsByOverlapCount = acceptedValues
    .reduce<
      Array<{
        /** The size of the overlap (ranking) */
        count: number;

        /** One of the acceptedValues */
        target: string;
      }>
    >((validCompletions, validValue) => {
      let overlap = 0;

      for (
        let charIndex = 0;
        charIndex < Math.min(validValue.length, value.length);
        charIndex++
      ) {
        const validChar = options?.ignoreCase
          ? validValue[charIndex].toLowerCase()
          : validValue[charIndex];
        const actualChar = options?.ignoreCase
          ? value[charIndex].toLowerCase()
          : value[charIndex];

        if (validChar !== actualChar) {
          break;
        }

        overlap += 1;
      }

      if (overlap === 0) {
        return validCompletions;
      }

      return [
        ...validCompletions,
        {
          count: overlap,
          target: validValue,
        },
      ];
    }, [])
    .sort((e) => e.count);

  if (autoCompletionsByOverlapCount.length === 0) {
    return undefined;
  }

  if (autoCompletionsByOverlapCount.length === 1 && options?.autocomplete) {
    return autoCompletionsByOverlapCount[0].target;
  }

  return autoCompletionsByOverlapCount[0].target.substr(
    0,
    autoCompletionsByOverlapCount[0].count,
  );
};

/**
 * Format the given value using the mask + match
 *
 * @param value - The string value to format
 * @param valueCharMaskMatch - A regular expression that matches characters to substitute in the match. This is typically `/\d/g` or `/\w/g`
 * @param mask - The mask to format against. Use # as a placeholder for
 */
export const formatAsMasked = (
  value: string | number,
  valueCharMaskMatch: RegExp,
  mask: string,
): string => {
  const valStr = String(value);
  let withMask = mask;

  if (valStr.trim() === "") {
    return "";
  }

  valStr.replace(valueCharMaskMatch, (match) => {
    withMask = withMask.replace(PLACEHOLDER, match);

    return match;
  });

  return withMask.split(PLACEHOLDER)[0];
};

/**
 * Creates a format definition with the given mask
 * Use the `#` char as a placeholder for a number
 */
export const createMaskedNumericFormatter = (
  name: string,
  mask: string,
): FormatType<
  string,
  string,
  {
    /** An enum of values that are also acceptable, and don't fall under the mask */
    exceptions?: Array<string>;
  }
> => {
  return {
    name,
    format: (value, options) => {
      if (typeof value !== "string") {
        return value;
      }

      if (options?.exceptions && options.exceptions.length > 0) {
        const formattedUsingExceptions = formatAsEnum(
          value,
          options.exceptions,
          {
            autocomplete: true,
            ignoreCase: true,
          },
        );

        if (formattedUsingExceptions !== undefined) {
          return formattedUsingExceptions;
        }
      }

      return formatAsMasked(value, /\d/g, mask);
    },
    deformat: (value, options) => {
      if (typeof value !== "string") {
        return value;
      }

      if (options?.exceptions && options.exceptions.length > 0) {
        const usingExceptions = formatAsEnum(value, options.exceptions, {
          autocomplete: false,
          ignoreCase: false,
        });

        if (usingExceptions !== undefined) {
          return usingExceptions;
        }
      }

      return formatAsMasked(value, /\d/g, mask.replace(/[^#]/g, ""));
    },
  };
};
