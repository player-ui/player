import { Registry } from '..';

let registry: Registry<any>;

beforeEach(() => {
  registry = new Registry();
});

test('clears values', () => {
  registry.set('foo', 'bar');
  expect(registry.get('foo')).toBe('bar');

  registry.clear();
  expect(registry.get('foo')).toBeUndefined();
});

test('can override a set value', () => {
  registry.set({ foo: 'bar' }, 'baz');
  registry.set({ foo: 'bar' }, 'blah');
  expect(registry.get({ foo: 'bar' })).toBe('blah');
});

test('falls back to a partially matched object', () => {
  registry.set({ foo: 'bar' }, 'blah');
  expect(registry.get({ foo: 'bar', bar: 'baz' })).toBe('blah');
});

test('uses more specific match if one exists', () => {
  const query = { foo: 'bar', metaData: { role: 'baz' } };
  registry.set({ foo: 'bar' }, 'blah');
  expect(registry.get(query)).toBe('blah');
  registry.set({ foo: 'bar', metaData: { role: 'baz' } }, 'stuff');
  expect(registry.get(query)).toBe('stuff');
});

test('works with seed data', () => {
  registry = new Registry([
    [{ type: 'foo' }, 'foo-bar'],
    [{ type: 'bar' }, 'bar-bar'],
  ]);
  expect(registry.get({ type: 'bar' })).toBe('bar-bar');
});

test('updates registry entries with new registry values', () => {
  registry = new Registry([
    [{ type: 'foo' }, 'registry1'],
    [{ type: 'bar' }, 'registry1'],
    [{ type: 'baz' }, 'registry1'],
  ]);
  const otherRegistry = new Registry([
    [{ type: 'foo' }, 'registry2'],
    [{ type: 'bar' }, 'registry2'],
  ]);

  otherRegistry.forEach((item) => registry.set(item.key, item.value));
  expect(registry.get({ type: 'foo' })).toBe('registry2');
  expect(registry.get({ type: 'bar' })).toBe('registry2');
  expect(registry.get({ type: 'baz' })).toBe('registry1');
});
