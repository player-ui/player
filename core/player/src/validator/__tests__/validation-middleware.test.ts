import { BindingParser } from '../../binding';
import type { DataModelImpl } from '../../data';
import { PipelinedDataModel, LocalModel } from '../../data';
import type { MiddlewareChecker } from '..';
import { ValidationMiddleware } from '..';

const parser = new BindingParser({
  get: () => undefined,
  set: () => undefined,
  evaluate: () => undefined,
});
const foo = parser.parse('foo');
const bar = parser.parse('bar');

describe('middleware', () => {
  /**
   * a sample validator that checks for non-vaz values.
   */
  const validator: MiddlewareChecker = (binding, model) => {
    if (model.get(binding) === 'baz') {
      return {
        severity: 'error',
        message: 'Wrong Value',
      };
    }
  };

  let baseDataModel: DataModelImpl;
  let dataModelWithMiddleware: ValidationMiddleware;

  beforeEach(() => {
    baseDataModel = new LocalModel();
    dataModelWithMiddleware = new ValidationMiddleware(validator);
  });

  it('allows valid data to fall through', () => {
    // Any valid value should fall through
    dataModelWithMiddleware.set([[foo, 'bar']], undefined, baseDataModel);
    expect(
      dataModelWithMiddleware.get(foo, undefined, baseDataModel)
    ).toStrictEqual('bar');
    expect(baseDataModel.get(foo)).toStrictEqual('bar');
  });

  it('catches invalid data', () => {
    // Any invalid data should stay in the middleware's cache
    dataModelWithMiddleware.set([[foo, 'bar']], undefined, baseDataModel);
    dataModelWithMiddleware.set([[foo, 'baz']], undefined, baseDataModel);
    expect(
      dataModelWithMiddleware.get(foo, { includeInvalid: true }, baseDataModel)
    ).toStrictEqual('baz');
    expect(baseDataModel.get(foo)).toStrictEqual('bar');
  });

  it('only returns updates for bindings set in the same transaction', () => {
    // Setup the invalid data
    const invalidUpdates = dataModelWithMiddleware.set(
      [[foo, 'baz']],
      undefined,
      baseDataModel
    );

    expect(invalidUpdates).toMatchInlineSnapshot(`
      Array [
        Object {
          "binding": BindingInstance {
            "factory": [Function],
            "joined": "foo",
            "split": Array [
              "foo",
            ],
          },
          "force": true,
          "newValue": "baz",
          "oldValue": "baz",
        },
      ]
    `);

    // Set some unrelated data
    const validUpdates = dataModelWithMiddleware.set(
      [[bar, 'baz']],
      undefined,
      baseDataModel
    );

    expect(validUpdates).toHaveLength(1);
  });
});

test('merges invalid', () => {
  const model = new PipelinedDataModel([
    new LocalModel({
      valid: true,
      invalid: false,
    }),
    new ValidationMiddleware((binding, validationModel) => {
      if (
        binding.asString() === 'invalid' &&
        validationModel.get(binding) !== false
      ) {
        return {
          severity: 'error',
          message: 'Nope',
        };
      }
    }),
  ]);

  expect(model.get(parser.parse(''))).toStrictEqual({
    valid: true,
    invalid: false,
  });

  model.set([[parser.parse('invalid'), true]]);

  expect(model.get(parser.parse(''), { includeInvalid: false })).toStrictEqual({
    valid: true,
    invalid: false,
  });

  expect(model.get(parser.parse(''), { includeInvalid: true })).toStrictEqual({
    valid: true,
    invalid: true,
  });
});
