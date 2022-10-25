import {
  BindingParser,
  ConstantsController,
  ExpressionEvaluator,
  LocalModel,
  withParser,
  NoopLogger,
} from '@player-ui/player';
import type {
  DataModelWithParser,
  ValidationObject,
  ValidatorContext,
} from '@player-ui/player';
import {
  expression,
  required,
  readonly,
  string,
  integer,
  collection,
  length,
  oneOf,
  regex,
  phone,
  email,
  zip,
  min,
  max,
} from '..';

/**
 *
 */
function create(
  validation: Partial<ValidationObject> = {},
  data: Record<string, unknown> = {}
) {
  const fullValidation: ValidationObject = {
    message: 'Something is wrong',
    type: 'unknown',
    severity: 'error',
    trigger: 'change',
    ...validation,
  };

  const localModel = new LocalModel(data);
  const parser = new BindingParser({
    get: localModel.get,
    set: localModel.set,
  });
  const model: DataModelWithParser = withParser(localModel, parser.parse);
  const context: ValidatorContext = {
    model,
    parseBinding: parser.parse,
    logger: new NoopLogger(),
    validation: fullValidation,
    constants: new ConstantsController(),
    evaluate: new ExpressionEvaluator({ model }).evaluate,
  };

  return { context, validation: fullValidation };
}

describe('required', () => {
  it('returns nothing for valid data', () => {
    const { context } = create({
      type: 'required',
    });

    expect(required(context, 0)).toBe(undefined);
    expect(required(context, [])).toBe(undefined);
    expect(required(context, 'foo')).toBe(undefined);
    expect(required(context, {})).toBe(undefined);
  });

  it('errors on empty data', () => {
    const { context } = create({
      type: 'required',
    });

    expect(required(context, '')?.message).toBe('A value is required');
    expect(required(context, undefined)?.message).toBe('A value is required');
    expect(required(context, null)?.message).toBe('A value is required');
  });

  it('handles required-if expressions', () => {
    const { context } = create(
      {
        type: 'required',
      },
      { foo: 'bar' }
    );

    expect(required(context, undefined, { if: '{{foo}} == "foo"' })).toBe(
      undefined
    );
    expect(
      required(context, undefined, { if: '{{foo}} == "bar"' })?.message
    ).toBe('A value is required');
  });

  it('handles required-if-not expressions', () => {
    const { context } = create(
      {
        type: 'required',
      },
      { foo: 'bar' }
    );

    expect(
      required(context, undefined, { ifNot: '{{foo}} == "foo"' })?.message
    ).toBe('A value is required');
    expect(required(context, undefined, { ifNot: '{{foo}} == "bar"' })).toBe(
      undefined
    );
  });
});

describe('expressions', () => {
  it('no error on valid expressions', () => {
    const { context, validation } = create({
      type: 'expression',
      exp: '"foo" == "foo"',
    });

    expect(expression(context, undefined, validation as any)).toBe(undefined);
  });

  it('error on invalid expressions', () => {
    const { context, validation } = create({
      type: 'expression',
      exp: '"foo" == "bar"',
    });

    expect(expression(context, undefined, validation as any)?.message).toBe(
      'Expression evaluation failed'
    );
  });

  it('does nothing with no expression', () => {
    const { context, validation } = create({
      type: 'expression',
    });

    expect(expression(context, undefined, validation as any)).toBe(undefined);
  });
});

describe('readonly', () => {
  it('only returns an error', () => {
    const { context } = create({ type: 'readonly' });
    expect(readonly(context, 'foo')?.message).toBe('Value cannot be modified');
    expect(readonly(context, undefined)?.message).toBe(
      'Value cannot be modified'
    );
  });
});

describe('string', () => {
  const { context } = create({ type: 'string' });

  it('works for strings', () => {
    expect(string(context, '')).toBe(undefined);
    expect(string(context, 'foo')).toBe(undefined);
  });

  it('handles nullish values', () => {
    expect(string(context, null)).toBe(undefined);
    expect(string(context, undefined)).toBe(undefined);
  });
  it('errors on non-strings', () => {
    expect(string(context, {})?.message).toBe('Value must be a string');
    expect(string(context, [])?.message).toBe('Value must be a string');
    expect(string(context, 1234)?.message).toBe('Value must be a string');
  });

  it('parameters on non-strings', () => {
    expect(string(context, {})?.parameters.type).toBe('object');
    expect(string(context, [])?.parameters.type).toBe('object');
    expect(string(context, 1234)?.parameters.type).toBe('number');
  });
});

describe('integer', () => {
  const { context } = create({ type: 'string' });

  it('works for integers', () => {
    expect(integer(context, -100)).toBe(undefined);
    expect(integer(context, 100)).toBe(undefined);
    expect(integer(context, 0)).toBe(undefined);
  });

  it('handles nullish values', () => {
    expect(integer(context, null)).toBe(undefined);
    expect(integer(context, undefined)).toBe(undefined);
  });

  it('errors on non-integers', () => {
    expect(integer(context, 1234.567)?.message).toBe(
      'Value must be an integer'
    );
  });

  it('parameters on non-integers', () => {
    expect(integer(context, 1234.567)?.parameters.type).toBe('number');
    expect(integer(context, 1234.567)?.parameters.flooredValue).toBe(1234);

    expect(integer(context, 'test')?.parameters.type).toBe('string');
    expect(integer(context, 'test')?.parameters.flooredValue).toBe(NaN);
  });

  it('errors on out of bounds integers', () => {
    expect(integer(context, Number.MAX_SAFE_INTEGER + 1)?.message).toBe(
      'Value must be an integer'
    );
    expect(integer(context, Number.MIN_SAFE_INTEGER - 1)?.message).toBe(
      'Value must be an integer'
    );
  });

  it('treats empty value as valid', () => {
    expect(integer(context, '')).toBe(undefined);
  });
});

describe('collection', () => {
  const { context } = create({ type: 'string' });

  it('works for arrays', () => {
    expect(collection(context, [])).toBe(undefined);
    expect(collection(context, ['foo'])).toBe(undefined);
    expect(collection(context, [1, 2, 3])).toBe(undefined);
  });

  it('handles nullish values', () => {
    expect(collection(context, null)).toBe(undefined);
    expect(collection(context, undefined)).toBe(undefined);
  });

  it('errors on non-arrays', () => {
    expect(collection(context, 1234.567)?.message).toBe(
      'Cannot set collection to non-array'
    );
    expect(collection(context, { 1: 'a' })?.message).toBe(
      'Cannot set collection to non-array'
    );
  });
});

describe('oneOf', () => {
  const { context } = create({ type: 'oneOf' });

  it('does nothing if no options are provided', () => {
    expect(oneOf(context, 'foo')).toBe(undefined);
    expect(oneOf(context, 'foo', {} as any)).toBe(undefined);
  });

  it('handles nullish values', () => {
    expect(oneOf(context, null, { options: ['foo', 'bar'] })).toBe(undefined);
    expect(oneOf(context, undefined, { options: ['foo', 'bar'] })).toBe(
      undefined
    );
  });
  it('works across types', () => {
    expect(oneOf(context, 'foo', { options: ['foo', 'bar'] })).toBe(undefined);
    expect(
      oneOf(context, 'not foo', { options: ['foo', 'bar'] })?.message
    ).toBe('Invalid entry');
    expect(oneOf(context, true, { options: ['foo', 'bar', true] })).toBe(
      undefined
    );
  });
});

describe('regex', () => {
  const { context } = create({ type: 'regex' });

  it('does nothing with invalid entries', () => {
    expect(regex(context, undefined)).toBe(undefined);
    expect(regex(context, null)).toBe(undefined);
    expect(regex(context, 'foo', { regex: 345 } as any)).toBe(undefined);
  });

  it('validates', () => {
    expect(regex(context, 'asset_text', { regex: 'asset' })).toBe(undefined);
    expect(regex(context, '', { regex: 'asset' })).toBe(undefined);
    expect(regex(context, 'asset_text', { regex: 'view' })?.message).toBe(
      'Invalid entry'
    );
    expect(regex(context, 'view_info', { regex: 'view' })).toBe(undefined);
    expect(regex(context, 'view_info', { regex: 'asset' })?.message).toBe(
      'Invalid entry'
    );
    expect(regex(context, 'FOO', { regex: 'foo' })?.message).toBe(
      'Invalid entry'
    );
    // i ignores case
    expect(regex(context, 'FOO', { regex: '/foo/i' })).toBe(undefined);
  });
});

describe('length', () => {
  const { context } = create({ type: 'length' });

  it('works on strings', () => {
    expect(length(context, '123', { exact: 3 })).toBe(undefined);
    expect(length(context, '123', { exact: 5 })?.message).toBe(
      'Must be exactly 5 characters long'
    );
    expect(
      length(context, '123', { exact: 5 })?.parameters?.validationLength
    ).toBe(3);

    expect(length(context, '123', { min: 3 })).toBe(undefined);
    expect(length(context, '123', { min: 10 })?.message).toBe(
      'At least 10 characters needed'
    );
    expect(
      length(context, '123', { min: 10 })?.parameters?.validationLength
    ).toBe(3);

    expect(length(context, '12345', { max: 3 })?.message).toBe(
      'Up to 3 characters allowed'
    );
    expect(
      length(context, '12345', { max: 3 })?.parameters?.validationLength
    ).toBe(5);
    expect(length(context, '12345', { max: 10 })).toBe(undefined);
  });
  it('works on objects', () => {
    expect(length(context, { 1: '1', 2: '2', 3: '3' }, { exact: 3 })).toBe(
      undefined
    );
    expect(
      length(context, { a: 'a', b: 'b', c: 'c' }, { exact: 5 })?.message
    ).toBe('Must be exactly 5 items long');
  });

  it('works on arrays', () => {
    expect(length(context, ['a', 'b', 'c'], { exact: 3 })).toBe(undefined);
    expect(length(context, ['a', 'b', 'c'], { exact: 5 })?.message).toBe(
      'Must be exactly 5 items long'
    );
  });

  it('does nothing when no length is present', () => {
    expect(length(context, '123')).toBe(undefined);
  });

  it('does nothing if it cant determine the length', () => {
    expect(length(context, undefined, { exact: 10 })).toBe(undefined);
    expect(length(context, null, { exact: 10 })).toBe(undefined);
    expect(length(context, 1234)).toBe(undefined);
  });
});

test('min', () => {
  const { context } = create({ type: 'min' });

  expect(min(context, undefined, { value: 1 })).toBeUndefined();
  expect(min(context, null, { value: 1 })).toBeUndefined();

  expect(min(context, 1)).toBeUndefined();
  expect(min(context, 1, { value: 1 })).toBeUndefined();
  expect(min(context, 2, { value: 1 })).toBeUndefined();
  expect(min(context, 0, { value: 1 })).toStrictEqual({
    message: 'Must be at least 1',
  });
});

test('max', () => {
  const { context } = create({ type: 'min' });
  expect(max(context, undefined, { value: 1 })).toBeUndefined();
  expect(max(context, null, { value: 1 })).toBeUndefined();
  expect(max(context, 1)).toBeUndefined();
  expect(max(context, 1, { value: 1 })).toBeUndefined();
  expect(max(context, 2, { value: 1 })).toStrictEqual({
    message: 'Cannot exceed 1',
  });
  expect(max(context, 0, { value: 1 })).toBeUndefined();
});

test('email', () => {
  const { context } = create({ type: 'email' });
  expect(email(context, undefined)).toBeUndefined();
  expect(email(context, null)).toBeUndefined();

  expect(email(context, 'abc.xyz@pqr.com')).toBeUndefined();
  expect(email(context, '')).toBeUndefined();
  expect(email(context, 'x.com')).toStrictEqual({
    message: 'Improper email format',
  });
});

describe('phone', () => {
  const { context } = create({ type: 'phone' });
  const invalid = { message: 'Invalid phone number' };
  it('works for good values', () => {
    expect(phone(context, '1234567890')).toBeUndefined();
    expect(phone(context, '')).toBeUndefined();
    expect(phone(context, '345-222-1212')).toBeUndefined();
    expect(phone(context, '+1-345-222-1212')).toBeUndefined();
    expect(phone(context, '3452221212')).toBeUndefined();
    expect(phone(context, '13452221212')).toBeUndefined();
    expect(phone(context, '1 345 222 1212')).toBeUndefined();
    expect(phone(context, '345 222 1212')).toBeUndefined();
    expect(phone(context, '(345) 222 1212')).toBeUndefined();
    expect(phone(context, '(345)222-1212')).toBeUndefined();
  });

  it('handles nullish values', () => {
    expect(phone(context, undefined)).toBeUndefined();
    expect(phone(context, null)).toBeUndefined();
  });

  it('returns error for invalid values', () => {
    expect(phone(context, '(345)222-121')).toStrictEqual(invalid);
    expect(phone(context, '(345) 222-121')).toStrictEqual(invalid);
    expect(phone(context, '(345)222-121B')).toStrictEqual(invalid);
    expect(phone(context, '(2345)222-1212')).toStrictEqual(invalid);
    expect(phone(context, '(345) aaa888-1212')).toStrictEqual(invalid);
    expect(phone(context, '+2-345-222-1212')).toStrictEqual(invalid);
    expect(phone(context, '+1-345-222-121')).toStrictEqual(invalid);
    expect(phone(context, '3')).toStrictEqual(invalid);
    expect(phone(context, 'A')).toStrictEqual(invalid);
    expect(phone(context, '+2-345-222-1212')).toStrictEqual(invalid);
  });
});

test('zip', () => {
  const { context } = create({ type: 'zip' });
  expect(zip(context, undefined)).toBeUndefined();
  expect(zip(context, null)).toBeUndefined();
  expect(zip(context, '21216-1213')).toBeUndefined();
  expect(zip(context, '2122')).toStrictEqual({ message: 'Invalid zip code' });
  expect(zip(context, '')).toBeUndefined();
});

describe('testing localization overrides', () => {
  it('should take the new message then the old message after rest', () => {
    const { context } = create({
      type: 'required',
    });
    const newMessages = {
      validation: {
        required: 'Wow thats like, super wrong',
      },
    };
    context.constants.setTemporaryValues(newMessages, 'constants');
    expect(required(context, '')?.message).toStrictEqual(
      newMessages.validation.required
    );

    context.constants.clearTemporaryValues();
    expect(required(context, '')?.message).toStrictEqual('A value is required');
  });
});
