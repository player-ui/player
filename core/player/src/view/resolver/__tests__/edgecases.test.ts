import { replaceAt, set, omit } from 'timm';

import { BindingParser } from '../../../binding';
import { ExpressionEvaluator } from '../../../expressions';
import { LocalModel, withParser } from '../../../data';
import { SchemaController } from '../../../schema';
import type { Logger } from '../../../logger';
import { TapableLogger } from '../../../logger';
import { Resolver } from '..';
import type { Node } from '../../parser';
import { NodeType, Parser } from '../../parser';
import { StringResolverPlugin } from '../../plugins';

describe('Dynamic AST Transforms', () => {
  const content = {
    id: 'main-view',
    type: 'questionAnswer',
    title: [
      {
        asset: {
          id: 'title',
          type: 'text',
          value: 'Cool Page',
        },
      },
    ],
    primaryInfo: [
      {
        asset: {
          id: 'subtitle',
          type: 'text',
          value: '{{year}}',
        },
      },
    ],
  };

  it('Dynamically added Nodes are properly resolved/cached on rerender', () => {
    const model = new LocalModel({
      year: '2021',
    });
    const parser = new Parser();
    const bindingParser = new BindingParser();
    const inputBinding = bindingParser.parse('year');
    const rootNode = parser.parseObject(content);

    const resolver = new Resolver(rootNode!, {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
    });

    // basic transform to change the asset
    resolver.hooks.beforeResolve.tap('test-plugin', (node) => {
      if (
        node?.type === NodeType.Asset ||
        node?.type === NodeType.View ||
        node?.type === NodeType.Value
      ) {
        let newNode = node;

        newNode.children?.forEach((child, i) => {
          if (child.path.length === 1) {
            // We have a child for this key
            // Check if it's an array and shouldn't be
            const { value: childNode } = child;
            if (childNode.type === 'multi-node') {
              if (childNode.values.length === 1) {
                // If there's only 1 node, no need for a collection, just up-level the asset that's there
                const firstChild = childNode.values[0];
                newNode = set(
                  newNode,
                  'children',
                  replaceAt(newNode.children ?? [], i, {
                    path: child.path,
                    value: {
                      ...firstChild,
                    },
                  })
                );
              }
            }
          }
        });
        if (newNode !== node) {
          // We updated something, set the children of the newNode to have the correct parent
          newNode.children?.forEach((child) => {
            // Don't worry about mutating here any new children are ones we created above
            // eslint-disable-next-line no-param-reassign
            child.value.parent = newNode;
          });
        }

        return newNode;
      }

      return node;
    });

    new StringResolverPlugin().applyResolver(resolver);

    const firstUpdate = resolver.update();
    expect(firstUpdate).toStrictEqual({
      id: 'main-view',
      type: 'questionAnswer',
      title: {
        asset: {
          id: 'title',
          type: 'text',
          value: 'Cool Page',
        },
      },
      primaryInfo: {
        asset: {
          id: 'subtitle',
          type: 'text',
          value: '2021',
        },
      },
    });

    model.set([[inputBinding, '2022']]);
    const secondUpdate = resolver.update(new Set([inputBinding]));
    expect(secondUpdate).toStrictEqual({
      id: 'main-view',
      type: 'questionAnswer',
      title: {
        asset: {
          id: 'title',
          type: 'text',
          value: 'Cool Page',
        },
      },
      primaryInfo: {
        asset: {
          id: 'subtitle',
          type: 'text',
          value: '2022',
        },
      },
    });
  });

  it('Nodes are properly cached on rerender', () => {
    const model = new LocalModel({
      year: '2021',
    });
    const parser = new Parser();
    const bindingParser = new BindingParser();
    const inputBinding = bindingParser.parse('year');
    const rootNode = parser.parseObject(content);

    const resolver = new Resolver(rootNode!, {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
    });

    resolver.update();

    const resolveCache = resolver.getResolveCache();

    resolver.update(new Set([inputBinding]));

    const newResolveCache = resolver.getResolveCache();

    expect(resolveCache.size).toBe(newResolveCache.size);

    // The cached items between each re-render should stay the same
    for (const [k, v] of resolveCache) {
      const excludingUpdated = omit(v, 'updated');

      expect(newResolveCache.has(k)).toBe(true);
      expect(newResolveCache.get(k)).toMatchObject(excludingUpdated);
    }
  });

  it('Cached node points to the correct parent node', () => {
    const view = {
      id: 'main-view',
      type: 'questionAnswer',
      title: [
        {
          asset: {
            id: 'title',
            type: 'text',
            value: 'Cool Page',
          },
        },
      ],
      primaryInfo: [
        {
          asset: {
            id: 'input',
            type: 'input',
            value: '{{year}}',
            label: {
              asset: {
                id: 'label',
                type: 'text',
                value: 'label',
              },
            },
          },
        },
      ],
    };

    const model = new LocalModel({
      year: '2021',
    });
    const parser = new Parser();
    const bindingParser = new BindingParser();
    const inputBinding = bindingParser.parse('year');
    const rootNode = parser.parseObject(view);

    const resolver = new Resolver(rootNode!, {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
    });

    let inputNode: Node.Node | undefined;
    let labelNode: Node.Node | undefined;

    resolver.hooks.beforeResolve.tap('test', (node, options) => {
      if (node?.type === 'asset' && node.value.id === 'input') {
        // Add to dependencies
        options.data.model.get(inputBinding);
      }

      return node;
    });

    resolver.hooks.afterResolve.tap('test', (value, node) => {
      if (node.type === 'asset') {
        const { id } = node.value;

        if (id === 'input') inputNode = node;

        if (id === 'label') labelNode = node;
      }

      return value;
    });

    resolver.update();

    model.set([[inputBinding, '2022']]);

    resolver.update(new Set([inputBinding]));

    // Check that label (which is cached) still points to the correct parent node.
    expect(labelNode?.parent).toBe(inputNode ?? {});
  });

  it('Fixes parent references when beforeResolve taps make changes', () => {
    const model = new LocalModel({
      year: '2021',
    });
    const parser = new Parser();
    const bindingParser = new BindingParser();
    const rootNode = parser.parseObject(content);

    const resolver = new Resolver(rootNode!, {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
    });

    let parent;
    resolver.hooks.beforeResolve.tap('test', (node) => {
      if (node?.type !== NodeType.Asset || node.value.id !== 'subtitle') {
        return node;
      }

      parent = node.parent;
      return {
        ...node,
        parent: undefined,
      };
    });

    let resolvedNode: Node.Node | undefined;
    resolver.hooks.afterResolve.tap('test', (resolvedValue, node) => {
      if (node?.type === NodeType.Asset && node.value.id === 'subtitle') {
        resolvedNode = node;
      }

      return resolvedValue;
    });

    resolver.update();

    expect(parent).not.toBeUndefined();
    expect(resolvedNode).not.toBeUndefined();
    expect(resolvedNode?.parent).toBe(parent);
  });
});

describe('Duplicate IDs', () => {
  it('Throws an error if two assets have the same id', () => {
    const content = {
      id: 'action',
      type: 'collection',
      values: [
        {
          asset: {
            id: 'action-1',
            type: 'action',
            label: {
              asset: {
                id: 'action-label-1',
                type: 'text',
                value: 'Clicked {{count1}} times',
              },
            },
          },
        },
        {
          asset: {
            id: 'action-1',
            type: 'action',
            label: {
              asset: {
                id: 'action-label-2',
                type: 'text',
                value: 'Clicked {{count2}} times',
              },
            },
          },
        },
      ],
    };

    const model = new LocalModel({
      count1: 0,
      count2: 0,
    });
    const parser = new Parser();
    const bindingParser = new BindingParser();
    const rootNode = parser.parseObject(content, NodeType.View);

    const logger = new TapableLogger();

    const testLogger: Logger = {
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    logger.addHandler(testLogger);

    const resolver = new Resolver(rootNode!, {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
      logger,
    });

    new StringResolverPlugin().applyResolver(resolver);

    const firstUpdate = resolver.update();

    expect(testLogger.error).toBeCalledTimes(1);
    expect(testLogger.error).toBeCalledWith(
      'Cache conflict: Found Asset/View nodes that have conflicting ids: action-1, may cause cache issues.'
    );
    (testLogger.error as jest.Mock).mockClear();

    expect(firstUpdate).toStrictEqual({
      id: 'action',
      type: 'collection',
      values: [
        {
          asset: {
            id: 'action-1',
            type: 'action',
            label: {
              asset: {
                id: 'action-label-1',
                type: 'text',
                value: 'Clicked 0 times',
              },
            },
          },
        },
        {
          asset: {
            id: 'action-1',
            type: 'action',
            label: {
              asset: {
                id: 'action-label-2',
                type: 'text',
                value: 'Clicked 0 times',
              },
            },
          },
        },
      ],
    });

    resolver.update();

    expect(testLogger.error).not.toBeCalled();
  });

  it('Throws a warning if two views have the same id', () => {
    const content = {
      id: 'action',
      type: 'collection',
      values: [
        {
          id: 'value-1',
          binding: 'count1',
        },
        {
          id: 'value-1',
          binding: 'count2',
        },
      ],
    };

    const model = new LocalModel({
      count1: 0,
      count2: 0,
    });
    const parser = new Parser();
    const bindingParser = new BindingParser();
    const rootNode = parser.parseObject(content, NodeType.View);

    const logger = new TapableLogger();

    const testLogger: Logger = {
      trace: jest.fn(),
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };

    logger.addHandler(testLogger);

    const resolver = new Resolver(rootNode!, {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
      logger,
    });

    new StringResolverPlugin().applyResolver(resolver);

    const firstUpdate = resolver.update();

    expect(testLogger.info).toBeCalledTimes(1);
    expect(testLogger.info).toBeCalledWith(
      'Cache conflict: Found Value nodes that have conflicting ids: value-1, may cause cache issues. To improve performance make value node IDs globally unique.'
    );
    (testLogger.info as jest.Mock).mockClear();
    expect(firstUpdate).toStrictEqual(content);

    resolver.update();

    expect(testLogger.info).not.toHaveBeenCalled();
  });
});

describe('AST caching', () => {
  it('skipping resolution of nodes should still repopulate AST map for itself and children', () => {
    const content = {
      id: 'collection',
      type: 'collection',
      values: [
        {
          id: 'value-1',
          type: 'collection',
          values: [
            {
              id: 'value-1-1',
            },
          ],
        },
      ],
    };

    const model = new LocalModel();
    const parser = new Parser();
    const bindingParser = new BindingParser();
    const rootNode = parser.parseObject(content, NodeType.View);
    const resolver = new Resolver(rootNode!, {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
    });

    const resolvedNodes: any[] = [];
    resolver.hooks.afterResolve.tap('afterResolve', (value, node) => {
      resolvedNodes.push(node);
      return value;
    });

    resolver.hooks.skipResolve.tap(
      'skipResolve',
      () => resolvedNodes.length >= 5
    );

    new StringResolverPlugin().applyResolver(resolver);

    expect(resolvedNodes).toHaveLength(0);

    resolver.update();

    const frozenResolvedNodes = [...resolvedNodes];
    expect(frozenResolvedNodes).toHaveLength(5);

    const sourceNodes = frozenResolvedNodes.map((node) => {
      const sourceNode = resolver.getSourceNode(node);
      expect(sourceNode).toBeDefined();
      return sourceNode;
    });

    resolver.update();

    frozenResolvedNodes.forEach((node, index) => {
      const sourceNode = resolver.getSourceNode(node);
      expect(sourceNode).toBeDefined();
      expect(sourceNode).toStrictEqual(sourceNodes[index]!);
    });
  });
});

describe('Root AST Immutability', () => {
  it('modifying nodes in beforeResolve should not impact the original tree', () => {
    const content = {
      id: 'action',
      type: 'collection',
      values: [
        {
          id: 'value-1',
          binding: 'count1',
        },
        {
          id: 'value-1',
          binding: 'count2',
        },
      ],
    };

    const model = new LocalModel();
    const parser = new Parser();
    const bindingParser = new BindingParser();
    const rootNode = parser.parseObject(content, NodeType.View);
    const resolver = new Resolver(rootNode!, {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
    });
    let finalNode;

    resolver.hooks.beforeResolve.tap('beforeResolve', (node) => {
      if (node?.type !== NodeType.View) return node;

      // eslint-disable-next-line no-param-reassign
      node.value.type = 'not-collection';
      return node;
    });

    resolver.hooks.afterResolve.tap('afterResolve', (value, node) => {
      if (node?.type === NodeType.View) {
        finalNode = node;
      }

      return value;
    });

    resolver.update();

    expect(rootNode).toBe(resolver.root);
    expect(rootNode).not.toBe(finalNode);
    expect(finalNode).toMatchObject({
      value: {
        type: 'not-collection',
      },
    });
    expect(rootNode).toMatchObject({
      value: {
        type: 'collection',
      },
    });
  });
});
