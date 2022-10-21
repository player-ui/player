import { toNum } from '../toNum';

describe('toNum', () => {
  test('returns the argument when provided a number', () => {
    expect(toNum(40)).toBe(40);
    expect(toNum(1.0)).toBe(1.0);
  });

  test('ignores all space', () => {
    expect(toNum(' \r\n\t50\t\n\r ')).toBe(50);
  });

  test('ignores all commas', () => {
    expect(toNum('400,000,000.00')).toBe(400000000.0);
  });

  test('ignores a single currency symbols', () => {
    expect(toNum('¥500')).toBe(500);
    expect(toNum('£-1')).toBe(-1);
    expect(toNum('$33.33')).toBe(33.33);
    expect(toNum('€20,000')).toBe(20000);
  });

  test('returns undef when the parameter has multiple currency symbols', () => {
    expect(toNum('¥50¥0')).toBe(undefined);
    expect(toNum('£-1£')).toBe(undefined);
    expect(toNum('$33.33$')).toBe(undefined);
    expect(toNum('€€20,000')).toBe(undefined);
  });

  test('returns undef if the parameter cannot be converted to number', () => {
    expect(toNum('hello')).toBe(undefined);
    expect(toNum({})).toBe(undefined);
    expect(toNum(undefined)).toBe(undefined);
  });

  test('returns 0 if the provided parameter is falsy and the 2nd parameter flag is true', () => {
    expect(toNum('', true)).toBe(0);
    expect(toNum(null, true)).toBe(0);
  });

  test('returns undef if the provided string parameter is empty and the 2nd parameter is false', () => {
    expect(toNum('', false)).toBe(undefined);
  });

  test('returns undef when only part of the input contains a number', () => {
    expect(toNum('123abc')).toBe(undefined);
  });

  test('does not parse hex, octal, or binary strings', () => {
    expect(toNum('0x123')).toBe(undefined);
    expect(toNum('0o123')).toBe(undefined);
    expect(toNum('0b123')).toBe(undefined);
  });
});
