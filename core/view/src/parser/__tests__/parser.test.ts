import { NodeType, Parser } from '../index';

describe('generates the correct AST', () => {
  const parser = new Parser();

  test('works with basic objects', () => {
    expect(parser.parseObject({ foo: 'bar' })).toStrictEqual({
      type: NodeType.Value,
      value: {
        foo: 'bar',
      },
    });
  });

  test('works with applicability things', () => {
    expect(
      parser.parseObject({ foo: 'bar', applicability: '{{baz}}' })
    ).toMatchSnapshot();

    expect(
      parser.parseObject({
        asset: {
          values: [
            {
              applicability: '{{foo}}',
              value: 'foo',
            },
            {
              value: 'bar',
            },
          ],
        },
      })
    ).toMatchSnapshot();
  });

  test('parses an object', () => {
    expect(parser.parseObject({ asset: { type: 'bar' } })).toMatchSnapshot();
  });

  test('parses a template', () => {
    expect(
      parser.parseObject({
        asset: {
          type: 'collection',
          template: [
            {
              data: 'foo.bar',
              output: 'values',
              value: {
                value: '{{foo.bar._index_}}',
              },
            },
          ],
        },
      })
    ).toMatchSnapshot();
  });

  test('parses nested templates', () => {
    expect(
      parser.parseObject({
        id: 'foo',
        type: 'collection',
        template: [
          {
            data: 'foo.pets',
            output: 'values',
            value: {
              asset: {
                type: 'collection',
                id: 'outer-collection-_index_',
                template: [
                  {
                    data: 'foo.people',
                    output: 'values',
                    value: {
                      text: '{{foo.pets._index_}} + {{foo.people._index1_}}',
                    },
                  },
                ],
              },
            },
          },
        ],
      })
    ).toMatchSnapshot();
  });

  test('parses a switch', () => {
    expect(
      parser.parseObject({
        staticSwitch: [
          {
            case: '{{foo.bar}}',
            asset: {
              type: 'foo',
            },
          },
        ],
      })
    ).toMatchSnapshot();
  });

  test('parses a nested switch', () => {
    expect(
      parser.parseObject({
        id: 'foo',
        fields: {
          staticSwitch: [
            {
              case: '{{bar}}',
              asset: {
                id: 'input-1',
                type: 'input',
              },
            },
            {
              case: '{{foo.bar}}',
              asset: {
                id: 'input-2',
                type: 'input',
              },
            },
          ],
        },
      })
    ).toMatchSnapshot();
  });

  test('parses an exp array', () => {
    expect(
      parser.parseObject(
        {
          id: 'foo',
          type: 'action',
          exp: ['{{please}} = "work"'],
        },
        NodeType.Asset
      )
    ).toMatchSnapshot();
  });

  test('keeps null values when parsing object', () => {
    expect(parser.parseObject({ foo: 'bar', baz: null })).toStrictEqual({
      type: NodeType.Value,
      value: {
        foo: 'bar',
        baz: null,
      },
    });
  });
});

describe('parseView', () => {
  const parser = new Parser();

  test('parses a simple view', () => {
    expect(
      parser.parseView({
        id: 'foo-view',
        type: 'viewtype',
        fields: {
          asset: {
            id: 'foo-asset',
            type: 'collection',
            values: [
              {
                asset: {
                  id: 'text-asset',
                  type: 'text',
                  value: 'bar',
                },
              },
              {
                asset: {
                  applicability: 'foo.bar',
                  id: 'input-asset',
                  type: 'input',
                },
              },
              {},
            ],
          },
        },
      } as any)
    ).toMatchSnapshot();
  });
});
