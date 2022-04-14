/**
 * Convert a string that might contain formatting (such as commas and a currency symbol) to a number
 */
export function toNum(val: unknown, coerceTo0?: boolean): number | undefined {
  if (typeof val === 'number') {
    return val;
  }

  if (typeof val === 'string' && val.length > 0) {
    // Trim whitespace
    let newVal = val.trim();
    // Remove all commas
    newVal = newVal.replace(/,/g, '');
    // Remove up to 1 commonly-used currency symbol
    newVal = newVal.replace(/[¥£$€]/, '');
    const nVal = Number(newVal);

    // ignore hex, binary, octal, and values that don't parse
    return newVal.match(/^0[xbo]/i) || isNaN(nVal) ? undefined : nVal;
  }

  return coerceTo0 ? 0 : undefined;
}
