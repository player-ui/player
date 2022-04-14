import React from 'react';
import { render } from 'react-json-reconciler';
import {
  makeBindingsForObject,
  SchemaGenerator,
  SchemaTypeName,
} from '../compiler/schema';
import { FooTypeRef, BarTypeRef, LocalBazType } from './helpers/mock-data-refs';

describe('Schema Bindings Generate Properly', () => {
  const testObj = {
    main: {
      sub: {
        a: FooTypeRef,
        b: BarTypeRef,
      },
      sub2: [
        {
          val: LocalBazType,
        },
      ],
      sub4: {
        [SchemaTypeName]: 'sub3',
        c: FooTypeRef,
      },
    },
  };

  it('is able to get bindings for all paths', () => {
    const schema = makeBindingsForObject(testObj);
    expect(schema.main.toRefString()).toStrictEqual('{{main}}');
    expect(schema.main.sub.toRefString()).toStrictEqual('{{main.sub}}');
    expect(schema.main.sub.a.toRefString()).toStrictEqual('{{main.sub.a}}');
    expect(schema.main.sub.b.toRefString()).toStrictEqual('{{main.sub.b}}');
    expect(schema.main.sub2.toRefString()).toStrictEqual('{{main.sub2}}');
    expect(schema.main.sub2[0].toRefString()).toStrictEqual('{{main.sub2.0}}');
    expect(schema.main.sub2._index_.toRefString()).toStrictEqual(
      '{{main.sub2._index_}}'
    );

    expect(schema.main.sub2[0].val.toRefString()).toStrictEqual(
      '{{main.sub2.0.val}}'
    );
    expect(
      // eslint-disable-next-line dot-notation
      schema.main.sub2['_index_'].toRefString()
    ).toStrictEqual('{{main.sub2._index_}}');
    expect(
      // eslint-disable-next-line dot-notation
      schema.main.sub2['_index_'].val.toRefString()
    ).toStrictEqual('{{main.sub2._index_.val}}');
  });

  it('is able to serialize to a schema object', () => {
    const g = new SchemaGenerator();
    const schema = g.toSchema(testObj);
    expect(schema).toMatchInlineSnapshot(`
      Object {
        "ROOT": Object {
          "main": Object {
            "type": "mainType",
          },
        },
        "mainType": Object {
          "sub": Object {
            "type": "subType",
          },
          "sub2": Object {
            "isArray": true,
            "type": "sub2Type",
          },
          "sub4": Object {
            "type": "sub3Type",
          },
        },
        "sub2Type": Object {
          "val": Object {
            "default": false,
            "type": "BazType",
            "validation": Array [
              Object {
                "message": "some message",
                "options": Array [
                  "1",
                  "2",
                ],
                "type": "someValidation",
              },
            ],
          },
        },
        "sub3Type": Object {
          "c": Object {
            "type": "FooType",
          },
        },
        "subType": Object {
          "a": Object {
            "type": "FooType",
          },
          "b": Object {
            "type": "BarType",
          },
        },
      }
    `);
  });

  it('is able to serialize to a schema object with a custom array indicator', () => {
    const g = new SchemaGenerator('isArray');
    const schema = g.toSchema(testObj);
    expect(schema).toMatchInlineSnapshot(`
      Object {
        "ROOT": Object {
          "main": Object {
            "type": "mainType",
          },
        },
        "mainType": Object {
          "sub": Object {
            "type": "subType",
          },
          "sub2": Object {
            "isArray": true,
            "type": "sub2Type",
          },
          "sub4": Object {
            "type": "sub3Type",
          },
        },
        "sub2Type": Object {
          "val": Object {
            "default": false,
            "type": "BazType",
            "validation": Array [
              Object {
                "message": "some message",
                "options": Array [
                  "1",
                  "2",
                ],
                "type": "someValidation",
              },
            ],
          },
        },
        "sub3Type": Object {
          "c": Object {
            "type": "FooType",
          },
        },
        "subType": Object {
          "a": Object {
            "type": "FooType",
          },
          "b": Object {
            "type": "BarType",
          },
        },
      }
    `);
  });

  it('throws errors if keys are duplicated', () => {
    const g = new SchemaGenerator();

    const badObj = {
      main: {
        sub: {
          a: FooTypeRef,
          b: BarTypeRef,
        },
        sub2: {
          sub: {
            a: FooTypeRef,
            b: BarTypeRef,
          },
        },
      },
    };

    expect(() => g.toSchema(badObj)).toThrowError(
      'Error: Generated two intermediate types with the name: subType'
    );
  });

  it('works when used as a jsx element', async () => {
    const schema = makeBindingsForObject(testObj);

    const content = await render(
      <obj>
        <property name="test">{schema.main.sub.a}</property>
      </obj>
    );

    expect(content).toMatchInlineSnapshot(`
      Object {
        "test": "{{main.sub.a}}",
      }
    `);
  });
});

describe('schema plugins', () => {
  const MetaData = Symbol('Meta Data');
  const testObj = {
    foo: {
      [MetaData]: {
        testProp: false,
      },
    },
  };

  it('enables node modification', () => {
    const schemaGenerator = new SchemaGenerator();

    schemaGenerator.hooks.createSchemaNode.tap('test', (node, prop) => {
      if (prop[MetaData]) {
        return {
          ...node,
          metaData: prop[MetaData],
        };
      }

      return node;
    });

    expect(schemaGenerator.toSchema(testObj)).toMatchInlineSnapshot(`
      Object {
        "ROOT": Object {
          "foo": Object {
            "metaData": Object {
              "testProp": false,
            },
            "type": "fooType",
          },
        },
        "fooType": Object {},
      }
    `);
  });
});
