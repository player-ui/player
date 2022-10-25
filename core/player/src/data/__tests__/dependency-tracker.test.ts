import { BindingParser } from '../../binding';
import { LocalModel, DependencyModel, DependencyMiddleware } from '..';

const parser = new BindingParser({
  get: () => undefined,
  set: () => undefined,
  evaluate: () => undefined,
});
const binding = parser.parse('foo.bar');

describe('dependency model', () => {
  it('tracks reads', () => {
    const trackedModel = new DependencyModel(
      new LocalModel({ foo: { bar: 'baz' } })
    );

    trackedModel.get(binding);
    expect(trackedModel.readsBinding(binding)).toBe(true);
    expect(trackedModel.readsBinding(parser.parse('foo.baz'))).toBe(false);
    expect(trackedModel.getDependencies().size).toBe(1);
  });

  it('tracks writes', () => {
    const trackedModel = new DependencyModel(
      new LocalModel({ foo: { bar: 'baz' } })
    );

    trackedModel.set([[binding, 'not baz']]);
    expect(trackedModel.writesBinding(binding)).toBe(true);
    expect(trackedModel.writesBinding(parser.parse('foo.baz'))).toBe(false);
    expect(trackedModel.getModified().size).toBe(1);
  });

  it(`uses the existing set instead of recreating a new one`, () => {
    const trackedModel = new DependencyModel(
      new LocalModel({ foo: { bar: 'baz' } })
    );
    const binding2 = parser.parse('foo.baz');

    trackedModel.trackSubset('core');
    trackedModel.get(binding);
    trackedModel.trackSubset('core');
    trackedModel.get(binding2);

    expect(trackedModel.getDependencies('core').size).toBe(2);
  });

  it('tracks dependency sets correctly', () => {
    const trackedModel = new DependencyModel(
      new LocalModel({ foo: { bar: 'baz' } })
    );
    const binding2 = parser.parse('foo.baz');
    const binding3 = parser.parse('foo.bad');

    trackedModel.trackSubset('children');
    trackedModel.get(binding);
    trackedModel.trackSubset('core');
    trackedModel.get(binding2);
    trackedModel.trackDefault();
    trackedModel.get(binding3);

    expect(trackedModel.getDependencies('children')).toMatchSnapshot();
    expect(trackedModel.getDependencies('core')).toMatchSnapshot();
    expect(trackedModel.getDependencies()).toMatchSnapshot();

    trackedModel.reset();
    expect(trackedModel.getDependencies('children').size).toBe(0);
    expect(trackedModel.getDependencies('core').size).toBe(0);
    expect(trackedModel.getDependencies().size).toBe(0);
  });

  it('adds a tracked dependency to children set', () => {
    const trackedModel = new DependencyModel(
      new LocalModel({ foo: { bar: 'baz' } })
    );

    trackedModel.addChildReadDep(binding);
    expect(trackedModel.getDependencies('children').size).toBe(1);
    expect(trackedModel.getDependencies('core').size).toBe(0);
    expect(trackedModel.getDependencies().size).toBe(1);
  });
});

describe('dependency model middleware', () => {
  it('tracks reads', () => {
    const base = new LocalModel({ foo: { bar: 'baz' } });
    const trackedModel = new DependencyMiddleware();

    trackedModel.get(binding, undefined, base);
    expect(trackedModel.readsBinding(binding)).toBe(true);
    expect(trackedModel.readsBinding(parser.parse('foo.baz'))).toBe(false);
    expect(trackedModel.getDependencies().size).toBe(1);
  });

  it('tracks a subset of read dependencies', () => {
    const base = new LocalModel({ foo: { bar: 'baz' } });
    const binding2 = parser.parse('foo.baz');
    const trackedModel = new DependencyMiddleware();

    trackedModel.trackSubset('children');
    trackedModel.get(binding, undefined, base);
    trackedModel.trackDefault();
    trackedModel.get(binding2, undefined, base);

    expect(trackedModel.getDependencies('children').size).toBe(1);
    expect(trackedModel.getDependencies('core').size).toBe(1);
    expect(trackedModel.getDependencies().size).toBe(2);

    trackedModel.reset();
    expect(trackedModel.getDependencies('children').size).toBe(0);
    expect(trackedModel.getDependencies('core').size).toBe(0);
    expect(trackedModel.getDependencies().size).toBe(0);
  });

  it('tracks writes', () => {
    const base = new LocalModel({ foo: { bar: 'baz' } });
    const trackedModel = new DependencyMiddleware();
    trackedModel.set([[binding, 'not baz']], undefined, base);
    expect(trackedModel.writesBinding(binding)).toBe(true);
    expect(trackedModel.writesBinding(parser.parse('foo.baz'))).toBe(false);
    expect(trackedModel.getModified().size).toBe(1);
    trackedModel.reset();
    expect(trackedModel.getModified().size).toBe(0);
  });

  it('tracks a subset of write dependencies', () => {
    const base = new LocalModel({ foo: { bar: 'baz' } });
    const binding2 = parser.parse('foo.baz');
    const trackedModel = new DependencyMiddleware();

    trackedModel.trackSubset('children');
    trackedModel.set([[binding, 'not baz']], undefined, base);
    trackedModel.trackDefault();
    trackedModel.set([[binding2, 'not bar']], undefined, base);

    expect(trackedModel.getModified('children').size).toBe(1);
    expect(trackedModel.getModified('core').size).toBe(1);
    expect(trackedModel.getModified().size).toBe(2);

    trackedModel.reset();
    expect(trackedModel.getModified('children').size).toBe(0);
    expect(trackedModel.getModified('core').size).toBe(0);
    expect(trackedModel.getModified().size).toBe(0);
  });
});
