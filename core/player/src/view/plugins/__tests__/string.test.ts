import { describe, expect, beforeEach, test } from 'vitest';
import { BindingParser } from '../../../binding';
import type { DataModelImpl } from '../../../data';
import { LocalModel, withParser } from '../../../data';
import { ExpressionEvaluator } from '../../../expressions';
import { SchemaController } from '../../../schema';
import type { Resolve } from '../../resolver';
import { Resolver } from '../../resolver';
import { NodeType, Parser } from '../../parser';
import { StringResolverPlugin } from '..';

describe('string-resolver', () => {
  let model: DataModelImpl;
  let expressionEvaluator: ExpressionEvaluator;
  let resolverOptions: Resolve.ResolverOptions;
  let parser: Parser;

  beforeEach(() => {
    const localModel = new LocalModel({
      name: 'Adam',
      age: 27,
      city: 'San Diego',
      nested: 'Name: {{name}} age: {{age}}',
    });

    const bindingParser = new BindingParser({
      set: localModel.set,
      get: localModel.get,
    });
    model = withParser(localModel, bindingParser.parse);

    expressionEvaluator = new ExpressionEvaluator({
      model,
    });
    parser = new Parser();

    resolverOptions = {
      evaluator: expressionEvaluator,
      model,
      parseBinding: bindingParser.parse,
      parseNode: parser.parseObject.bind(parser),
      schema: new SchemaController(),
    };
  });

  test('resolves basic objects', () => {
    const root = parser.parseObject({
      asset: {
        type: 'bar',
        name: 'My name is {{name}}',
        age: '{{age}}',
        alt: '{{nested}}',
      },
    });
    const resolver = new Resolver(root!, resolverOptions);
    new StringResolverPlugin().applyResolver(resolver);
    expect(resolver.update()).toStrictEqual({
      asset: {
        type: 'bar',
        name: 'My name is Adam',
        age: 27,
        alt: 'Name: Adam age: 27',
      },
    });
  });

  test('skips exp prop when configured', () => {
    const root = parser.parseObject({
      asset: {
        type: 'bar',
        name: 'My name is {{name}}',
        age: '{{age}}',
        alt: '{{nested}}',
        exp: {
          onStart: '{{name}} = "test"',
        },
        label: {
          asset: {
            id: 'foo',
            type: 'bar',
            exp: '{{name}} = "other"',
          },
        },
      },
    });

    const resolver = new Resolver(root!, resolverOptions);

    resolver.hooks.beforeResolve.tap('test', (n) => {
      if (n?.type === NodeType.Asset || n?.type === NodeType.View) {
        return {
          ...n,
          plugins: {
            stringResolver: {
              propertiesToSkip: ['exp'],
            },
          },
        };
      }
    });

    new StringResolverPlugin().applyResolver(resolver);
    expect(resolver.update()).toStrictEqual({
      asset: {
        type: 'bar',
        name: 'My name is Adam',
        age: 27,
        alt: 'Name: Adam age: 27',
        exp: {
          onStart: '{{name}} = "test"',
        },
        label: {
          asset: {
            id: 'foo',
            type: 'bar',
            exp: '{{name}} = "other"',
          },
        },
      },
    });
  });
});
