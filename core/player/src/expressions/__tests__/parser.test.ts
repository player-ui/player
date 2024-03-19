import { parseExpression } from '../parser';
import { ExpNodeOpaqueIdentifier } from '../types';

test('the happy stuff', () => {
  expect(parseExpression('foo')).toMatchSnapshot();
  expect(parseExpression('foo === bar')).toMatchSnapshot();
  expect(parseExpression('foo || bar')).toMatchSnapshot();
  expect(parseExpression('foo(bar)')).toMatchSnapshot();
  expect(parseExpression('{{foo}} = "bar"')).toMatchSnapshot();
  expect(parseExpression('{{foo}} ? "bar" : "baz"')).toMatchSnapshot();
  expect(parseExpression('foo[bar]')).toMatchSnapshot();
  expect(
    parseExpression('{{foo}} == "string\nwith\tbreaks"')
  ).toMatchSnapshot();
  expect(parseExpression('foo = [1, 2, 3]')).toMatchSnapshot();
});

test('nested binary op location', () => {
  expect(parseExpression('foo === bar === baz')).toStrictEqual({
    __id: ExpNodeOpaqueIdentifier,
    type: 'BinaryExpression',
    operator: '===',
    left: {
      __id: ExpNodeOpaqueIdentifier,
      type: 'BinaryExpression',
      operator: '===',
      left: {
        __id: ExpNodeOpaqueIdentifier,
        type: 'Identifier',
        name: 'foo',
        location: {
          start: { character: 0 },
          end: { character: 3 },
        },
      },
      right: {
        __id: ExpNodeOpaqueIdentifier,
        type: 'Identifier',
        name: 'bar',
        location: {
          start: { character: 8 },
          end: { character: 11 },
        },
      },
      location: {
        start: { character: 0 },
        end: { character: 11 },
      },
    },
    right: {
      __id: ExpNodeOpaqueIdentifier,
      type: 'Identifier',
      name: 'baz',
      location: {
        start: { character: 16 },
        end: { character: 19 },
      },
    },
    location: {
      start: { character: 0 },
      end: { character: 19 },
    },
  });
});

test('the bad stuff', () => {
  expect(() => parseExpression('{{foo')).toThrowError();
  expect(() => parseExpression('{{foo}')).toThrowError();
  expect(() => parseExpression('foo["bar"')).toThrowError();
  expect(() => parseExpression('foo["bar')).toThrowError();
  expect(() => parseExpression('foo]')).toThrowError();
  expect(() => parseExpression('foo = (bar')).toThrowError();
  expect(() => parseExpression('foo(')).toThrowError();
});
describe('expression parser', () => {
  test('objects- in parser', () => {
    expect(parseExpression('{"foo": "value"}')).toMatchSnapshot();
    expect(parseExpression('{"foo": {{some.binding}}}')).toMatchSnapshot();
    expect(parseExpression('{"foo": 1 + 2}')).toMatchSnapshot();
    expect(parseExpression('{"foo": "value", "bar": "baz"}')).toMatchSnapshot();
    expect(
      parseExpression('{"foo": "value", "bar": { "baz":  "foo" }}')
    ).toMatchSnapshot();
    expect(
      parseExpression('publish("test", {"key": "value"})')
    ).toMatchSnapshot();
    // no closing brace
    expect(() => parseExpression('{"foo": "value"')).toThrowError();
    // no key
    expect(() => parseExpression('{: "value"}')).toThrowError();
    // no value
    expect(() => parseExpression('{"key": }')).toThrowError();
    // no colon
    expect(() => parseExpression('{"key" "value" }')).toThrowError();
    // no comma
    expect(() =>
      parseExpression('{"key": "value" "key2": "value" }')
    ).toThrowError();
  });
});

describe('graceful parsing', () => {
  it('returns and sets the error for invalid expression', () => {
    const parsed = parseExpression('{{foo}} = {{bar}', {
      strict: false,
    });

    expect(parsed).toBeTruthy();
    expect(parsed.error).toBeTruthy();
    expect(parsed.error?.message).toBe(
      'Unclosed brace after "bar}" at character 16'
    );
  });
});
