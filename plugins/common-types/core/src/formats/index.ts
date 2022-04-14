import type { FormatType } from '@player-ui/schema';
import { createMaskedNumericFormatter } from './utils';

const LENGTH_OF_MAX_INT = String(Number.MAX_SAFE_INTEGER).split('').length;

/**
 * Converts an integer to and from a string for display
 */
export const integer: FormatType<number, string> = {
  name: 'integer',

  /** Converts any integer to a string */
  format: (value) => {
    if (value === '-') {
      return value;
    }

    const formatted = integer.deformat?.(value) ?? value;

    if (typeof formatted === 'number') {
      return String(formatted);
    }

    return '';
  },

  /** Converts any string or number to an integer */
  deformat: (value) => {
    if (typeof value === 'number') {
      // Handle different zeros. Math.floor(-0) is still -0
      return Math.floor(value) + 0;
    }

    if (typeof value !== 'string') {
      return;
    }

    const isNeg = value.replace(/[^0-9.-]/g, '').charAt(0) === '-';

    // Remove everything but digits and decimal
    let digits = value.replace(/[^0-9.]/g, '');
    const decimalPlace = digits.indexOf('.');

    if (decimalPlace > -1) {
      digits = digits.substring(0, decimalPlace);
    }

    if (digits.length === 0) {
      return;
    }

    // Can't be longer than the biggest int
    digits = digits.substr(0, LENGTH_OF_MAX_INT);

    const num = Number(`${isNeg ? '-' : ''}${digits}`);

    // Handle different zeros. Math.floor(-0) is still -0
    return Math.floor(num) + 0;
  },
};

/** Converts a number to/from a comma separated version */
export const commaNumber: FormatType<
  number,
  string,
  {
    /** The number of decimal places to show */
    precision?: number;
  }
> = {
  name: 'commaNumber',

  /** Go from number to number w/ commas */
  format: (_value, options) => {
    if (_value === undefined || _value === '') {
      return _value;
    }

    if (typeof _value !== 'string' && typeof _value !== 'number') {
      return '';
    }

    const value = String(_value);

    // Check to see if first valid char is a negative
    const isNeg = value.replace(/[^0-9.-]/g, '').charAt(0) === '-';
    // Remove everything but digits and decimal
    let digitAndDecimal = value.replace(/[^0-9.]/g, '');
    // Remove extra leading zeros
    digitAndDecimal = digitAndDecimal.replace(/^(0*)((0.)?\d)/g, '$2');

    // Find index of first decimal point, for insertion later
    const firstDecimal = digitAndDecimal.indexOf('.');

    // Remove all non-digits i.e. extra decimal points
    const digitsOnly = digitAndDecimal.replace(/[^0-9]/g, '');

    let preDecDigits = digitsOnly;
    let postDecDigits = '';

    if (firstDecimal >= 0) {
      preDecDigits = digitsOnly
        .substring(0, firstDecimal)
        .substr(0, LENGTH_OF_MAX_INT);
      postDecDigits = digitsOnly.substring(firstDecimal);
    } else {
      preDecDigits = preDecDigits.substr(0, LENGTH_OF_MAX_INT);
    }

    if (options?.precision !== undefined) {
      postDecDigits = postDecDigits
        .substring(0, options.precision)
        .padEnd(options.precision, '0');
    }

    // Beautify
    preDecDigits = preDecDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (preDecDigits === '' && firstDecimal === 0) {
      preDecDigits = '0';
    }

    // Put pieces together
    let retVal = preDecDigits;

    if (isNeg) {
      retVal = `-${retVal}`;
    }

    if (firstDecimal >= 0 || options?.precision !== undefined) {
      retVal += `.${postDecDigits}`;
    }

    return retVal;
  },

  /** Go from string with comma's to numbers */
  deformat: (value) => {
    if (typeof value !== 'string') {
      return value;
    }

    const strValue = value.replace(/,/g, '');

    if (strValue === '') {
      return undefined;
    }

    const number = Number(strValue);

    return isNaN(number) ||
      number > Number.MAX_SAFE_INTEGER ||
      number < Number.MIN_SAFE_INTEGER
      ? undefined
      : number;
  },
};

export const date: FormatType<
  string,
  string,
  {
    /** The mask to use to format the date */
    mask?: string;
  }
> = {
  name: 'date',

  format: (_value, options) => {
    let value = typeof _value === 'number' ? String(_value) : _value;
    if (_value === undefined) {
      return undefined;
    }

    if (typeof value !== 'string' || value === '') {
      return '';
    }

    // matching anything in DDDD-DD-DD format, including invalid date like 1111-99-99
    if (value.match(/^\d{4}[-]\d{1,2}[-]\d{1,2}$/)) {
      const tempVal = value.split('-');
      value = `${tempVal[1]}/${tempVal[2]}/${tempVal[0]}`;
    }

    const dateFormat = options?.mask?.toUpperCase() ?? 'MM/DD/YYYY';

    const delimiter = dateFormat.replace(/[^/.-]/g, '').charAt(0);
    const formatParts = dateFormat.split(delimiter);
    const valueParts = value.split(delimiter);
    const processedValueParts = [];
    let lastMatchIsFull = true;

    for (let index = 0; index < valueParts.length; index++) {
      let part = valueParts[index];

      if (lastMatchIsFull && index < formatParts.length) {
        // Remove all non-digits
        part = part.replace(/[^0-9]/g, '');
        const isLastExpectedField = formatParts.length - 1 === index;
        const hasDelimiterAfter = valueParts.length - 1 > index;
        const curFormat = formatParts[index];

        if (curFormat === 'YYYY') {
          if (part.length > 4) {
            valueParts[index + 1] = [
              '*',
              part.substring(4),
              valueParts[index + 1],
            ].join('');
            part = part.substring(0, 4);
          }

          if (part.length === 4) {
            lastMatchIsFull = true;
            processedValueParts.push(part);
          }

          if (part.length === 3) {
            if (isLastExpectedField || !hasDelimiterAfter) {
              lastMatchIsFull = false;
              processedValueParts.push(part);
            } else {
              valueParts[index + 1] = `*${part.substring(2)}${
                valueParts[index + 1]
              }`;
              part = part.substring(0, 2);
            }
          }

          if (part.length === 2) {
            // Autocomplete completes 2 digit years based on rule:
            // If autocompleted year is in this millennium up to this year + 2
            // Else put it in the last millennium
            // 19 and 20 aren't autocompleted unless there is a separator after
            let autocomplete;

            // If user didn't enter 2 digits, don't autocomplete YYYY
            // Otherwise, 19 and 20 aren't autocompleted unless there is a separator after
            if (
              part.length === 2 &&
              (hasDelimiterAfter ||
                (isLastExpectedField && part !== '19' && part !== '20'))
            ) {
              autocomplete = `20${part}`;

              if (
                part > (new Date().getFullYear() + 5).toString().substring(2)
              ) {
                autocomplete = `19${part}`;
              }
            }

            if (autocomplete) {
              lastMatchIsFull = true;
              processedValueParts.push(autocomplete);
            } else {
              lastMatchIsFull = false;
              processedValueParts.push(part);
            }
          }

          if (part.length === 1 || part.length === 0) {
            lastMatchIsFull = false;
            processedValueParts.push(part);
          }
        } else if (curFormat === 'YY') {
          if (part.length > 2) {
            valueParts[index + 1] = [
              '*',
              part.substring(2),
              valueParts[index + 1],
            ].join('');
            part = part.substring(0, 2);
          }

          if (part.length === 2) {
            lastMatchIsFull = true;
            processedValueParts.push(part);
          }

          if (part.length === 1 || part.length === 0) {
            lastMatchIsFull = false;
            processedValueParts.push(part);
          }
        } else {
          // Only MM and DD left
          if (part.length > 2) {
            valueParts[index + 1] = [
              '*',
              part.substring(2),
              valueParts[index + 1],
            ].join('');
            part = part.substring(0, 2);
          }

          if (part.length === 2) {
            // 00 isn't a valid month or day,
            // but if they typed in a delimiter,
            // let them deal with it being wrong
            if (part === '00' && !hasDelimiterAfter) {
              lastMatchIsFull = false;
              processedValueParts.push('0');
            } else {
              lastMatchIsFull = true;
              processedValueParts.push(part);
            }
          }

          if (part.length === 1) {
            if (hasDelimiterAfter) {
              lastMatchIsFull = true;
              processedValueParts.push(`0${part}`);
            } else {
              lastMatchIsFull = false;
              processedValueParts.push(part);
            }
          }

          if (part.length === 0) {
            lastMatchIsFull = false;
            processedValueParts.push(part);
          }
        }
      }
    }

    return processedValueParts.join(delimiter);
  },
};

export const currency: FormatType<
  number,
  string,
  {
    /** The symbol to use for currency */
    currencySymbol?: string;

    /** Use parenthesis instead of a - sign for negative values */
    useParensForNeg?: boolean;

    /** The number of decimal places to show */
    precision?: number;
  }
> = {
  name: 'currency',
  format: (_value, options) => {
    const value = typeof _value === 'number' ? String(_value) : _value;
    const {
      currencySymbol = '',
      useParensForNeg = false,
      precision = 2,
    } = options ?? {};

    if (value === undefined || value === '') {
      return value;
    }

    if (typeof value !== 'string') {
      return value;
    }

    const sign = /^\s*-/.test(value) ? -1 : 1;
    const dotIndex = value.indexOf('.');

    let preDecimal: string;
    let postDecimal: string;

    // Strip out non-digits
    // Check if first non-empty character is a minus sign
    if (dotIndex >= 0) {
      preDecimal = value.substr(0, dotIndex).replace(/\D+/g, '');
      postDecimal = value.substr(dotIndex + 1).replace(/\D+/g, '');
    } else {
      preDecimal = value.replace(/\D+/g, '');
      postDecimal = '0';
    }

    const numericalValue = sign * Number(`${preDecimal}.${postDecimal}`);

    const fixedString = numericalValue.toFixed(precision);

    // Beautify - add commas between groups of 3 digits
    // Would need to split the string first if we had more than 3 decimal places
    const prettyString = fixedString.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    if (prettyString.charAt(0) === '-') {
      if (useParensForNeg) {
        return `(${currencySymbol}${prettyString.substring(1)})`;
      }

      return `-${currencySymbol}${prettyString.substring(1)}`;
    }

    return currencySymbol + prettyString;
  },
  deformat: (value, options) => {
    if (typeof value === 'number') {
      return value;
    }

    if (typeof value !== 'string') {
      return undefined;
    }

    let deformatted = value;

    if (options?.currencySymbol) {
      deformatted = value.replace(options.currencySymbol, '');
    }

    return commaNumber.deformat?.(deformatted);
  },
};

const basePhoneFormatter = createMaskedNumericFormatter(
  'phone',
  '(###) ###-####'
);

export const phone: FormatType<string> = {
  ...basePhoneFormatter,
  deformat: (value) => basePhoneFormatter.deformat?.(value),
  format: (value) =>
    basePhoneFormatter.format?.(value === '(' ? '' : value) ?? value,
};
