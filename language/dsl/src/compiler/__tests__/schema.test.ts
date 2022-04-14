import { SchemaGenerator } from '../schema';

const BasicDataType = {
  type: 'StringType',
};

test('generates proper schema', () => {
  const schemaGenerator = new SchemaGenerator();

  expect(
    schemaGenerator.toSchema({
      foo: {
        bar: {
          baz: BasicDataType,
        },
      },
      other: [
        {
          item1: BasicDataType,
        },
      ],
    })
  ).toStrictEqual({
    ROOT: {
      foo: {
        type: 'fooType',
      },
      other: {
        type: 'otherType',
        isArray: true,
      },
    },
    fooType: {
      bar: {
        type: 'barType',
      },
    },
    barType: {
      baz: {
        type: 'StringType',
      },
    },
    otherType: {
      item1: {
        type: 'StringType',
      },
    },
  });
});
