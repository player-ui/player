import { BindingParser } from '@player-ui/binding';
import { LocalModel, withParser } from '@player-ui/data';
import { SchemaController } from '@player-ui/schema';
import { NodeType, Parser } from '../index';
import { SwitchPlugin, ApplicabilityPlugin, TemplatePlugin } from '../..';
import type { Options } from '../../plugins/options';
import { ExpressionEvaluator } from '../../../../expressions/src';
import type { DataModelWithParser } from '../../../../player/src';

const parseBinding = new BindingParser().parse;
describe('generates the correct AST', () => {
  let model: DataModelWithParser;
  let expressionEvaluator: ExpressionEvaluator;
  let options: Options;
  let parser: Parser;

  beforeEach(() => {
    model = withParser(new LocalModel(), parseBinding);
    expressionEvaluator = new ExpressionEvaluator({
      model,
    });
    parser = new Parser();
    options = {
      evaluate: expressionEvaluator.evaluate,
      schema: new SchemaController(),
      data: {
        format: (binding, val) => val,
        formatValue: (val) => val,
        model,
      },
    };
    new TemplatePlugin(options).applyParserHooks(parser);
    new ApplicabilityPlugin().applyParser(parser);
    new SwitchPlugin(options).applyParser(parser);
  });

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
  new ApplicabilityPlugin().applyParser(parser);

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
