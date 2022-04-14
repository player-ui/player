import { BindingParser } from '@player-ui/binding';
import { LocalModel } from '@player-ui/data';
import { ValidationMiddleware } from '@player-ui/validator';
import { DataController } from '..';

test('works with basic data', () => {
  const model = {
    foo: {
      bar: 'baz',
    },
    bar: 'foo',
    baz: [{ foo: '1' }],
  };
  const localData = new LocalModel(model);

  const parser = new BindingParser({ get: localData.get, set: localData.set });
  const controller = new DataController({}, { pathResolver: parser });

  controller.hooks.resolveDataStages.tap('basic', () => [localData]);

  expect(controller.get('foo')).toStrictEqual(model.foo);
  expect(controller.get('foo.bar')).toStrictEqual(model.foo.bar);
  expect(controller.get('baz.0.foo')).toStrictEqual(model.baz[0].foo);

  controller.set({ 'foo.baz': 'bar' });
  expect(controller.get('foo.baz')).toStrictEqual('bar');
});

test('works with path segments starting with numbers', () => {
  const model = {
    foo: {
      '5f4704fd-adab-49df-bcbc-5aedb04194f9': {
        bar: 'baz',
      },
    },
  };
  const localData = new LocalModel(model);

  const parser = new BindingParser({ get: localData.get, set: localData.set });
  const controller = new DataController({}, { pathResolver: parser });

  controller.hooks.resolveDataStages.tap('basic', () => [localData]);

  expect(controller.get('foo.5f4704fd-adab-49df-bcbc-5aedb04194f9.bar')).toBe(
    'baz'
  );
});

test('works with nested model refs', () => {
  const model = {
    foo: {
      bar: 'baz',
    },
    other: 'bar',
  };

  const localData = new LocalModel(model);

  const parser = new BindingParser({ get: localData.get, set: localData.set });
  const controller = new DataController({}, { pathResolver: parser });

  controller.hooks.resolveDataStages.tap('basic', () => [localData]);

  expect(controller.get('foo.{{other}}')).toStrictEqual(model.foo.bar);
});

test('works with variable indexes', () => {
  const model = {
    foo: [{ bar: 'AAA' }, { bar: 'BBB' }],
    baz: 1,
  };

  const localData = new LocalModel(model);

  const parser = new BindingParser({ get: localData.get, set: localData.set });
  const controller = new DataController({}, { pathResolver: parser });

  controller.hooks.resolveDataStages.tap('basic', () => [localData]);

  expect(controller.get('foo[{{baz}}].bar')).toStrictEqual('BBB');
  controller.set([['baz', 0]]);
  expect(controller.get('foo[{{baz}}].bar')).toStrictEqual('AAA');
});

test('works with updates', () => {
  const model = {
    foo: [{ UUID: 'not baz' }],
  };

  const localData = new LocalModel(model);

  const parser = new BindingParser({ get: localData.get, set: localData.set });
  const controller = new DataController({}, { pathResolver: parser });

  controller.hooks.resolveDataStages.tap('basic', () => [localData]);

  controller.set({
    "foo[UUID='baz'].blah": 'blah',
  });

  expect(controller.get('foo.0.UUID')).toStrictEqual(model.foo[0].UUID);
  expect(controller.get('foo.1.UUID')).toStrictEqual('baz');
  expect(controller.get('foo.1.blah')).toStrictEqual('blah');
});

describe('delete', () => {
  test('requires binding', () => {
    const model = {
      foo: {
        bar: 'Some Data',
      },
    };

    const localData = new LocalModel(model);

    const parser = new BindingParser({
      get: localData.get,
      set: localData.set,
    });
    const controller = new DataController({}, { pathResolver: parser });

    controller.hooks.resolveDataStages.tap('Local', () => [localData]);

    expect(() => controller.delete(undefined as any)).toThrow(
      'Invalid arguments: delete expects a data path (string)'
    );
  });

  test('does nothing if not in dataModel', () => {
    const model = {
      foo: {
        bar: 'Some Data',
      },
    };
    const localData = new LocalModel(model);

    const parser = new BindingParser({
      get: localData.get,
      set: localData.set,
    });
    const controller = new DataController({}, { pathResolver: parser });
    controller.hooks.resolveDataStages.tap('Local', () => [localData]);

    controller.delete('foo.baz');

    expect(controller.getTrash()).toStrictEqual(new Set());
    expect(controller.get('')).toStrictEqual({
      foo: { bar: 'Some Data' },
    });
  });

  test('deletes property', () => {
    const model = {
      foo: {
        bar: 'Some Data',
      },
    };
    const localData = new LocalModel(model);

    const parser = new BindingParser({
      get: localData.get,
      set: localData.set,
    });
    const controller = new DataController({}, { pathResolver: parser });
    controller.hooks.resolveDataStages.tap('Local', () => [localData]);

    controller.delete('foo.bar');

    expect(controller.getTrash()).toStrictEqual(
      new Set([parser.parse('foo.bar')])
    );
    expect(controller.get('')).toStrictEqual({ foo: {} });
  });

  test('deletes array item', () => {
    const model = {
      foo: ['Some Data'],
    };
    const localData = new LocalModel(model);

    const parser = new BindingParser({
      get: localData.get,
      set: localData.set,
    });
    const controller = new DataController({}, { pathResolver: parser });
    controller.hooks.resolveDataStages.tap('Local', () => [localData]);

    controller.delete('foo.0');

    expect(controller.getTrash()).toStrictEqual(
      new Set([parser.parse('foo.0')])
    );
    expect(controller.get('')).toStrictEqual({ foo: [] });
  });

  test("doesn't delete data that is out of range", () => {
    const model = {
      foo: ['Some Data'],
    };
    const localData = new LocalModel(model);

    const parser = new BindingParser({
      get: localData.get,
      set: localData.set,
    });
    const controller = new DataController({}, { pathResolver: parser });
    controller.hooks.resolveDataStages.tap('Local', () => [localData]);

    controller.delete('foo.1');

    expect(controller.getTrash()).toStrictEqual(new Set());
    expect(controller.get('')).toStrictEqual({ foo: ['Some Data'] });
  });

  test('deletes root property', () => {
    const model = {
      foo: {
        bar: 'Some Data',
      },
      baz: 'Other data',
    };
    const localData = new LocalModel(model);

    const parser = new BindingParser({
      get: localData.get,
      set: localData.set,
    });
    const controller = new DataController({}, { pathResolver: parser });
    controller.hooks.resolveDataStages.tap('Local', () => [localData]);

    controller.delete('foo');

    expect(controller.getTrash()).toStrictEqual(new Set([parser.parse('foo')]));
    expect(controller.get('')).toStrictEqual({ baz: 'Other data' });
  });

  test('deletes nothing for a blank binding', () => {
    const model = {
      foo: {
        bar: 'Some Data',
      },
    };
    const localData = new LocalModel(model);

    const parser = new BindingParser({
      get: localData.get,
      set: localData.set,
    });
    const controller = new DataController({}, { pathResolver: parser });
    controller.hooks.resolveDataStages.tap('Local', () => [localData]);

    controller.delete('');

    expect(controller.getTrash()).toStrictEqual(new Set());
    expect(controller.get('')).toStrictEqual({
      foo: {
        bar: 'Some Data',
      },
    });
  });
});

describe('formatting', () => {
  it('formats data', () => {
    const localData = new LocalModel({});

    const parser = new BindingParser({
      get: localData.get,
      set: localData.set,
    });
    const controller = new DataController({}, { pathResolver: parser });

    controller.hooks.format.tap('test', (val) => {
      if (val === 'should-format') {
        return 'formatted!';
      }

      return val;
    });

    controller.hooks.deformat.tap('test', (val) => {
      if (val === 'should-deformat') {
        return 'deformatted!';
      }

      return val;
    });

    controller.set([['foo.bar', 'should-format']], { formatted: true });
    expect(controller.get('foo.bar')).toBe('should-format');
    expect(controller.get('foo.bar', { formatted: true })).toBe('formatted!');

    controller.set([['foo.baz', 'should-deformat']]);
    expect(controller.get('foo.baz')).toBe('should-deformat');

    controller.set([['foo.baz', 'should-deformat']], { formatted: true });
    expect(controller.get('foo.baz')).toBe('deformatted!');
  });
});

describe('serialization', () => {
  it('can hook into serializing', () => {
    const localData = new LocalModel();
    const parser = new BindingParser({
      get: localData.get,
      set: localData.set,
    });
    const controller = new DataController(
      { testData: 0 },
      { pathResolver: parser }
    );

    controller.hooks.serialize.tap('test', (dataModel) => {
      return {
        ...dataModel,
        keys: Object.keys(dataModel),
      };
    });

    expect(controller.serialize()).toStrictEqual({
      testData: 0,
      keys: ['testData'],
    });
  });

  it('doesnt include invalid data', () => {
    const localData = new LocalModel();
    const parser = new BindingParser({
      get: localData.get,
      set: localData.set,
    });

    const dc = new DataController(
      { valid: true, invalid: false },
      {
        pathResolver: parser,
        middleware: [
          new ValidationMiddleware((binding, model) => {
            if (
              binding.asString() === 'invalid' &&
              model.get(binding) !== false
            ) {
              return {
                severity: 'error',
                message: 'Nope',
              };
            }
          }),
        ],
      }
    );

    expect(dc?.serialize()).toStrictEqual({
      valid: true,
      invalid: false,
    });

    dc.set([['invalid', true]]);

    expect(dc?.serialize()).toStrictEqual({
      valid: true,
      invalid: false,
    });

    expect(dc.get('', { includeInvalid: true })).toStrictEqual({
      valid: true,
      invalid: true,
    });
  });
});

describe('default value', () => {
  it('gets/sets with default', () => {
    const model = {
      foo: 'foo',
    };

    const localData = new LocalModel(model);

    const parser = new BindingParser({
      get: localData.get,
      set: localData.set,
    });
    const controller = new DataController({}, { pathResolver: parser });

    controller.hooks.resolveDefaultValue.tap('test', (b) => {
      if (b.asString() === 'foo') {
        return 'FOO';
      }

      // eslint-disable-next-line jest/no-if
      if (b.asString() === 'bar') {
        return 'BAR';
      }
    });

    controller.hooks.resolveDataStages.tap('basic', () => [localData]);

    expect(controller.get('bar')).toBe('BAR');

    controller.set([['foo', undefined]]);
    expect(controller.get('foo')).toBe('FOO');

    // The data isn't actually set though
    expect(controller.get('')).toStrictEqual({ foo: undefined });
  });
});

it('should not send update for deeply equal data', () => {
  const model = {
    user: {
      name: 'frodo',
      age: 3,
    },
  };

  const localData = new LocalModel(model);

  const parser = new BindingParser({
    get: localData.get,
    set: localData.set,
  });
  const controller = new DataController({}, { pathResolver: parser });
  controller.hooks.resolveDataStages.tap('basic', () => [localData]);

  const onUpdateCallback = jest.fn();
  controller.hooks.onUpdate.tap('test', onUpdateCallback);

  controller.set([['user', { name: 'frodo', age: 3 }]]);

  expect(onUpdateCallback).not.toBeCalled();
});
