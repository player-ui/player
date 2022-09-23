import { BindingParser } from '@player-ui/binding';
import type { DataModelWithParser } from '@player-ui/data';
import { LocalModel, withParser } from '@player-ui/data';
import { ExpressionEvaluator } from '@player-ui/expressions';
import { SchemaController } from '@player-ui/schema';
import { NodeType } from '../../parser';
import { Parser } from '../../parser';
import { ViewInstance } from '../../view';
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
    new TemplatePlugin(options).applyParser(parser);
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

  it('determines if nodeType is template', () => {
    const nodeTest = 'template';
    const nodeType = parser.hooks.determineNodeType.call(nodeTest);
    expect(nodeType).toStrictEqual('template');
  });

  it('Does not return a nodeType', () => {
    const nodeTest = {
      value: 'foo',
    };
    const nodeType = parser.hooks.determineNodeType.call(nodeTest);
    expect(nodeType).toBe(undefined);
  });

  it('returns templateNode if template exists', () => {
    const obj = {
      dynamic: true,
      data: 'foo.bar',
      output: 'values',
      value: {
        value: '{{foo.bar._index_}}',
      },
    };
    const nodeOptions = {
      templateDepth: 1,
    };
    const parsedNode = parser.hooks.parseNode.call(
      obj,
      NodeType.Value,
      nodeOptions,
      NodeType.Template
    );
    expect(parsedNode).toStrictEqual({
      data: 'foo.bar',
      depth: 1,
      dynamic: true,
      template: {
        value: '{{foo.bar._index_}}',
      },
      type: 'template',
    });
  });

  it('returns templateNode if template exists, and templateDepth is not set', () => {
    const obj = {
      data: 'foo.bar2',
      output: 'values',
      dynamic: true,
      value: {
        value: '{{foo.bar2._index_}}',
      },
    };
    const nodeOptions = {};
    const parsedNode = parser.hooks.parseNode.call(
      obj,
      NodeType.Value,
      nodeOptions,
      NodeType.Template
    );
    expect(parsedNode).toStrictEqual({
      data: 'foo.bar2',
      depth: 0,
      dynamic: true,
      template: {
        value: '{{foo.bar2._index_}}',
      },
      type: 'template',
    });
  });
});

describe('dynamic templates', () => {
  it('static - nodes are not updated', () => {
    const petNames = ['Ginger', 'Vokey'];
    const model = withParser(new LocalModel({}), parseBinding);
    const evaluator = new ExpressionEvaluator({ model });
    const schema = new SchemaController();

    const view = new ViewInstance(
      {
        id: 'my-view',
        asset: {
          id: 'foo',
          type: 'collection',
          template: [
            {
              dynamic: false,
              data: 'foo.bar',
              output: 'values',
              value: {
                value: '{{foo.bar._index_}}',
              },
            },
          ],
        },
      } as any,
      {
        model,
        parseBinding,
        evaluator,
        schema,
      }
    );

    model.set([['foo.bar', petNames]]);

    const resolved = view.update();

    expect(resolved).toStrictEqual({
      id: 'my-view',
      asset: {
        id: 'foo',
        type: 'collection',
        values: ['Ginger', 'Vokey'].map((value) => ({ value })),
      },
    });

    model.set([['foo.bar', ['Ginger', 'Vokey', 'Harry']]]);

    let updated = view.update();
    expect(updated).toStrictEqual({
      id: 'my-view',
      asset: {
        id: 'foo',
        type: 'collection',
        values: ['Ginger', 'Vokey'].map((value) => ({ value })),
      },
    });

    model.set([['foo.bar', ['Ginger']]]);
    updated = view.update();
    expect(updated).toStrictEqual({
      id: 'my-view',
      asset: {
        id: 'foo',
        type: 'collection',
        values: ['Ginger', undefined].map((value) => ({ value })),
      },
    });
  });

  it('dynamic - nodes are updated', () => {
    const petNames = ['Ginger', 'Vokey'];
    const model = withParser(new LocalModel({}), parseBinding);
    const evaluator = new ExpressionEvaluator({ model });
    const schema = new SchemaController();

    const view = new ViewInstance(
      {
        id: 'my-view',
        asset: {
          id: 'foo',
          type: 'collection',
          template: [
            {
              dynamic: true,
              data: 'foo.bar',
              output: 'values',
              value: {
                value: '{{foo.bar._index_}}',
              },
            },
          ],
        },
      } as any,
      {
        model,
        parseBinding,
        evaluator,
        schema,
      }
    );

    model.set([['foo.bar', petNames]]);

    const resolved = view.update();

    expect(resolved).toStrictEqual({
      id: 'my-view',
      asset: {
        id: 'foo',
        type: 'collection',
        values: ['Ginger', 'Vokey'].map((value) => ({ value })),
      },
    });

    const barBinding = parseBinding('foo.bar');
    model.set([[barBinding, ['Vokey', 'Louis', 'Bob']]]);

    let updated = view.update();
    expect(updated).toStrictEqual({
      id: 'my-view',
      asset: {
        id: 'foo',
        type: 'collection',
        values: ['Vokey', 'Louis', 'Bob'].map((value) => ({ value })),
      },
    });

    model.set([[barBinding, ['Nuri']]]);
    updated = view.update();
    expect(updated).toStrictEqual({
      id: 'my-view',
      asset: {
        id: 'foo',
        type: 'collection',
        values: ['Nuri'].map((value) => ({ value })),
      },
    });
  });
});
