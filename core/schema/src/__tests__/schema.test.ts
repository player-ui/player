import { BindingParser } from '@player-ui/binding';
import { SchemaController } from '..';

const { parse } = new BindingParser({
  get: () => undefined,
  set: () => undefined,
  evaluate: () => undefined,
});

describe('schema', () => {
  const schema = new SchemaController({
    ROOT: {
      pets: {
        type: 'PetType',
        isArray: true,
      },
      owner: {
        type: 'OwnerType',
      },
    },
    PetType: {
      name: {
        type: 'StringType',
        validation: [
          {
            type: 'required',
          },
        ],
      },
    },
    OwnerType: {
      name: {
        type: 'FirstNameType',
        validation: [
          {
            type: 'enum',
            options: ['adam'],
          },
        ],
      },
    },
  });

  test('gets basic type info', () => {
    expect(schema.getType(parse('owner.name'))?.type).toBe('FirstNameType');
    expect(schema.getValidationsForBinding(parse('owner.name'))).toStrictEqual([
      {
        type: 'enum',
        options: ['adam'],
        trigger: 'change',
        severity: 'error',
      },
    ]);
  });

  test('gets the type for objects in an array', () => {
    expect(schema.getType(parse('pets.4.name'))?.type).toBe('StringType');
    expect(
      schema.getValidationsForBinding(parse('pets.999.name'))
    ).toStrictEqual([
      {
        type: 'required',
        trigger: 'change',
        severity: 'error',
      },
    ]);
  });

  test('gets the type for an array parent', () => {
    expect(schema.getType(parse('pets'))).toStrictEqual({
      type: 'PetType',
      isArray: true,
    });
  });
});
