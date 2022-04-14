import { BindingParser } from '@player-ui/binding';
import type { DataModelWithParser } from '@player-ui/data';
import { LocalModel, withParser } from '@player-ui/data';
import { ExpressionEvaluator } from '@player-ui/expressions';
import { SchemaController } from '@player-ui/schema';
import { Parser } from '../../parser';
import type { Options } from '../options';
import TemplatePlugin from '../template-plugin';

const parseBinding = new BindingParser().parse;

describe('templates', () => {
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
  });

  it('works with simple ones', () => {
    const petNames = ['Ginger', 'Daisy', 'Afra'];
    model.set([['foo.bar', petNames]]);

    expect(
      parser.parseObject({
        id: 'foo',
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
      })
    ).toMatchSnapshot();
  });

  it('works with nested templates', () => {
    const petNames = ['Ginger', 'Daisy', 'Afra'];
    model.set([['foo.pets', petNames]]);

    const peopleNames = ['Adam', 'Jenny'];
    model.set([['foo.people', peopleNames]]);

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
});
