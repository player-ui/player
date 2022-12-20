import type { ExpressionContext, DataModelWithParser } from '@player-ui/player';
import { BindingParser, LocalModel, withParser } from '@player-ui/player';
import {
  size,
  concat,
  round,
  floor,
  ceil,
  trim,
  upperCase,
  lowerCase,
  replace,
  titleCase,
  sentenceCase,
  isEmpty,
  isNotEmpty,
  findProperty,
  findPropertyIndex,
  sum,
  containsAny,
} from '..';

const parseBinding = new BindingParser().parse;
describe('expr functions', () => {
  let model: DataModelWithParser;
  let context: ExpressionContext;

  beforeEach(() => {
    model = withParser(new LocalModel(), parseBinding);
    context = {
      model,
      evaluate: () => undefined,
    };
  });

  describe('replace', () => {
    test('works on simple things', () => {
      expect(replace(context, 'foo-bar-baz', 'bar-', '')).toBe('foo-baz');
      expect(replace(context, 'adam #1', '1', '2')).toBe('adam #2');
    });

    test('replaces all occurrences', () => {
      expect(replace(context, 'B1 B2 B3 B4', 'B', 'A')).toBe('A1 A2 A3 A4');
    });

    test('leaves non-string things alone', () => {
      expect(replace(context, 2, 'foo', 'bar')).toBe(2);
      expect(replace(context, undefined, undefined)).toBe(undefined);
      expect(replace(context, 'foo', undefined)).toBe('foo');
    });

    test('defaults to empty replacement', () => {
      expect(replace(context, 'foo', 'o')).toBe('f');
    });
  });

  describe('math', () => {
    it('works for rounding', () => {
      expect(round(context, '1.5')).toBe(2);
      expect(round(context, 1.5)).toBe(2);
      expect(round(context, '-1.7')).toBe(-2);
      expect(round(context, -1.7)).toBe(-2);
      expect(round(context, undefined as any)).toBe(0);
    });

    it('works for ceil', () => {
      expect(ceil(context, '1.5')).toBe(2);
      expect(ceil(context, 1.3)).toBe(2);
    });

    it('works for floor', () => {
      expect(floor(context, '1.5')).toBe(1);
      expect(floor(context, 1.3)).toBe(1);
    });

    it('works for sum', () => {
      expect(sum(context, 1, 2, 3)).toBe(1 + 2 + 3);
      expect(sum(context, '1', 2, '3')).toBe(1 + 2 + 3);
    });
  });

  describe('strings', () => {
    test('trim', () => {
      expect(trim(context, '   foo   ')).toBe('foo');
      expect(trim(context, 123)).toBe(123);
    });

    test('upperCase', () => {
      expect(upperCase(context, 'foo bar')).toBe('FOO BAR');
    });

    test('lowerCase', () => {
      expect(lowerCase(context, 'FOO BaR')).toBe('foo bar');
    });

    test('titleCase', () => {
      expect(titleCase(context, 'foo bar Baz')).toBe('Foo Bar Baz');
    });

    test('sentenceCase', () => {
      expect(sentenceCase(context, 'foo Bar baz')).toBe('Foo Bar baz');
    });
  });

  describe('size', () => {
    test('good things', () => {
      expect(size(context, 'foo')).toBe(3);
      expect(size(context, [1, 2, 3, 4])).toBe(4);
      expect(size(context, { foo: 'bar', baz: 'blah' })).toBe(2);
    });

    test('bad things', () => {
      expect(size(context, null)).toBe(0);
      expect(size(context, undefined)).toBe(0);
      expect(size(context, 12)).toBe(0);
    });
  });

  describe('concat', () => {
    test('strings', () => {
      expect(concat(context, '1')).toBe('1');
      expect(concat(context, '1', 1)).toBe('11');
      expect(concat(context, 1, 1)).toBe('11');
      expect(concat(context, '1', '2', '3')).toBe('123');
      expect(concat(context, 1, undefined)).toBe('1');
      expect(concat(context, 0, 1, undefined)).toBe('01');
    });

    test('arrays', () => {
      expect(concat(context, [1, 2], [3, 4])).toStrictEqual([1, 2, 3, 4]);
    });
  });

  describe('isNotEmpty', () => {
    test('isNotEmpty', () => {
      expect(isNotEmpty(context, '')).toBe(false);
      expect(isNotEmpty(context, undefined)).toBe(false);
      expect(isNotEmpty(context, null)).toBe(false);
      expect(isNotEmpty(context, 'foo')).toBe(true);
      expect(isNotEmpty(context, 12)).toBe(true);
      expect(isNotEmpty(context, [])).toBe(false);
      expect(isNotEmpty(context, [100])).toBe(true);
      expect(isNotEmpty(context, [{ foo: 'bar' }, { foo: 'bar1' }])).toBe(true);
      expect(isNotEmpty(context, {})).toBe(false);
      expect(isNotEmpty(context, { foo: 'bar' })).toBe(true);
      // eslint-disable-next-line prefer-const
      let dummy;
      expect(isNotEmpty(context, dummy)).toBe(false);
      dummy = { key: '1' };
      expect(isNotEmpty(context, dummy)).toBe(true);
      expect(isNotEmpty(context, dummy.key)).toBe(true);
    });
  });

  test('isEmpty', () => {
    expect(isEmpty(context, '')).toBe(true);
    expect(isEmpty(context, undefined)).toBe(true);
    expect(isEmpty(context, null)).toBe(true);
    expect(isEmpty(context, 'foo')).toBe(false);
    expect(isEmpty(context, 12)).toBe(false);
    expect(isEmpty(context, [])).toBe(true);
    expect(isEmpty(context, [100])).toBe(false);
    expect(isEmpty(context, [{ foo: 'bar' }, { foo: 'bar1' }])).toBe(false);
    expect(isEmpty(context, {})).toBe(true);
    expect(isEmpty(context, { foo: 'bar' })).toBe(false);
    expect(isEmpty(context, undefined)).toBe(true);
    const dummy = { key: '1' };
    expect(isEmpty(context, dummy)).toBe(false);
    expect(isEmpty(context, dummy.key)).toBe(false);
  });

  describe('findProperty', () => {
    beforeEach(() => {
      model.set([
        [
          'people',
          [
            {
              name: 'Adam',
              pet: 'dog',
            },
            {
              name: 'Margie',
              pet: 'cat',
            },
          ],
        ],
        ['names', ['Adam', 'Tyler', 'Andrew', 'Kendall']],
      ]);
    });

    test('finds the right object when using a model reference', () => {
      const property = findProperty(
        context,
        'people',
        'name',
        'Margie',
        'pet',
        undefined
      );

      const propertyIndex = findPropertyIndex(
        context,
        'people',
        'name',
        'Margie'
      );

      expect(property).toBe('cat');
      expect(propertyIndex).toBe(1);
    });

    test('finds the right object when using direct arrays', () => {
      const arr = [
        {
          name: 'Adam',
          pet: 'dog',
        },
        {
          name: 'Margie',
          pet: 'cat',
        },
      ];

      const property = findProperty(
        context,
        arr,
        'name',
        'Margie',
        'pet',
        undefined
      );

      const propertyIndex = findPropertyIndex(context, arr, 'name', 'Margie');

      expect(property).toBe('cat');
      expect(propertyIndex).toBe(1);
    });

    test('index not found', () => {
      const propertyIndex = findPropertyIndex(
        context,
        'people',
        'name',
        'Tyler'
      );

      expect(propertyIndex).toBe(-1);
    });

    test('non-existant model ref', () => {
      expect(findPropertyIndex(context, 'not-there', 'name', 'Adam')).toBe(-1);
      expect(
        findProperty(
          context,
          'not-there',
          'name',
          'Adam',
          undefined,
          'defaultVal'
        )
      ).toBe('defaultVal');
    });

    test('fallback value', () => {
      const property = findProperty(
        context,
        'people',
        'name',
        'Tyler',
        'pet',
        'rabbit'
      );

      expect(property).toBe('rabbit');
    });

    test('works for value arrays', () => {
      expect(findPropertyIndex(context, 'names', undefined, 'Adam')).toBe(0);
      expect(
        findProperty(context, 'names', undefined, 'Adam', undefined, undefined)
      ).toBe('Adam');
    });
  });
  describe('containsAny', () => {
    beforeEach(() => {
      model.set([
        [
          'people',
          [
            {
              name: 'Adam',
              pet: 'dog',
            },
            {
              name: 'Margie',
              pet: 'cat',
            },
          ],
        ],
        ['names', ['Adam', 'Tyler', 'Andrew', 'Kendall']],
      ]);
    });

    test('find a keyword from a string', () => {
      const str = 'The quick brown fox jumps over the lazy dog';
      expect(containsAny(context, str, 'fox')).toBe(true);
      expect(containsAny(context, str, 'Fox')).toBe(false);
    });
    test('find a keyword from an array', () => {
      const str = 'The quick brown fox jumps over the lazy dog';
      expect(containsAny(context, str, ['fox'])).toBe(true);
      expect(containsAny(context, str, ['Fox'])).toBe(false);
      expect(containsAny(context, str, ['Fox', 'dog'])).toBe(true);
    });

    test('should return true since keyword exists (second arg is string)', () => {
      expect(containsAny(context, 'foo', 'foo')).toBe(true);
    });

    test('should return true since keyword exists (second arg is array)', () => {
      expect(containsAny(context, 'foo', ['foo', 'bar'])).toBe(true);
    });

    test('should return false since keyword does not exist (second arg is array)', () => {
      expect(containsAny(context, 'fuba', ['foo', 'bar'])).toBe(false);
    });

    test('should return false since keyword does not exist (second arg is string)', () => {
      expect(containsAny(context, 'foo', 'bar')).toBe(false);
    });

    test('should return false since first argument is bad', () => {
      // @ts-ignore:next
      expect(containsAny(context, null, 'bar')).toBe(false);
    });

    test('should return false since second argument is bad', () => {
      // @ts-ignore:next
      expect(containsAny(context, 'foo', null)).toBe(false);
    });

    test('should return true since second argument as blank is acceptable', () => {
      expect(containsAny(context, 'foo', '')).toBe(true);
    });

    test('should return true since both arguments as blank is acceptable', () => {
      expect(containsAny(context, '', '')).toBe(true);
    });

    test('should return false since first argument is blank and second is not', () => {
      expect(containsAny(context, '', 'bar')).toBe(false);
    });

    test('should return false since first agument is blank and second argument is an empty array', () => {
      expect(containsAny(context, '', [])).toBe(false);
    });

    test('should return false since second argument is an empty array', () => {
      expect(containsAny(context, 'foo', [])).toBe(false);
    });
  });
});
