import parse from '../parser';

test('the happy stuff', () => {
  expect(parse('foo')).toMatchSnapshot();
  expect(parse('foo === bar')).toMatchSnapshot();
  expect(parse('foo || bar')).toMatchSnapshot();
  expect(parse('foo(bar)')).toMatchSnapshot();
  expect(parse('{{foo}} = "bar"')).toMatchSnapshot();
  expect(parse('{{foo}} ? "bar" : "baz"')).toMatchSnapshot();
  expect(parse('foo[bar]')).toMatchSnapshot();
  expect(parse('{{foo}} == "string\nwith\tbreaks"')).toMatchSnapshot();
  expect(parse('foo = [1, 2, 3]')).toMatchSnapshot();
});

test('the bad stuff', () => {
  expect(() => parse('{{foo')).toThrowError();
  expect(() => parse('{{foo}')).toThrowError();
  expect(() => parse('foo["bar"')).toThrowError();
  expect(() => parse('foo["bar')).toThrowError();
  expect(() => parse('foo]')).toThrowError();
  expect(() => parse('foo = (bar')).toThrowError();
});
describe('expression parser', () => {
  test('objects- in parser', () => {
    expect(parse('{"foo": "value"}')).toMatchSnapshot();
    expect(parse('{"foo": {{some.binding}}}')).toMatchSnapshot();
    expect(parse('{"foo": 1 + 2}')).toMatchSnapshot();
    expect(parse('{"foo": "value", "bar": "baz"}')).toMatchSnapshot();
    expect(
      parse('{"foo": "value", "bar": { "baz":  "foo" }}')
    ).toMatchSnapshot();
    expect(parse('publish("test", {"key": "value"})')).toMatchSnapshot();
    // no closing brace
    expect(() => parse('{"foo": "value"')).toThrowError();
    // no key
    expect(() => parse('{: "value"}')).toThrowError();
    // no value
    expect(() => parse('{"key": }')).toThrowError();
    // no colon
    expect(() => parse('{"key" "value" }')).toThrowError();
    // no comma
    expect(() => parse('{"key": "value" "key2": "value" }')).toThrowError();
  });
});
