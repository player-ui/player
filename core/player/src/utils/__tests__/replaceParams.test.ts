import { describe, test, expect } from 'vitest';
import { replaceParams } from '..';

describe('Replace Params', () => {
  test('should replace strings correctly', () => {
    const actual = replaceParams(
      'The desired length of this field is %desiredLength. The current length is %currentLength.',
      { desiredLength: 5, currentLength: 10 }
    );
    const expected =
      'The desired length of this field is 5. The current length is 10.';
    expect(actual).toBe(expected);
  });

  test('do not replace strings for no match', () => {
    const actual = replaceParams(
      'The desired length of this field is %desiredLength. The current length is %currentLength.',
      { desiredLength: 5 }
    );
    const expected =
      'The desired length of this field is 5. The current length is %currentLength.';
    expect(actual).toBe(expected);
  });

  test('do not replace strings for no templates', () => {
    const actual = replaceParams(
      'No template in this string. Ignore parameters',
      { desiredLength: 5, currentLength: 10 }
    );
    const expected = 'No template in this string. Ignore parameters';
    expect(actual).toBe(expected);
  });
});
