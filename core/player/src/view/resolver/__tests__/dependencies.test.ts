import { describe, it, expect } from "vitest";
import { BindingParser } from "../../../binding";
import { ExpressionEvaluator } from "../../../expressions";
import { LocalModel, withParser } from "../../../data";
import { SchemaController } from "../../../schema";
import { Resolver } from "..";
import { Parser } from "../../parser";
import { StringResolverPlugin } from "../../plugins";

const actions = {
  id: "action",
  type: "collection",
  values: [
    {
      asset: {
        id: "action-1",
        type: "action",
        label: {
          asset: {
            id: "action-label-1",
            type: "text",
            value: "Clicked {{count1}} times",
          },
        },
      },
    },
    {
      asset: {
        id: "action-2",
        type: "action",
        label: {
          asset: {
            id: "action-label-2",
            type: "text",
            value: "Clicked {{count2}} times",
          },
        },
      },
    },
  ],
};

const nestedActions = {
  id: "action",
  type: "collection",
  values: [
    {
      asset: {
        id: "action-1",
        type: "action",
        label: {
          asset: {
            id: "action-label-1",
            type: "text",
            value: "Clicked {{count1}} times",
          },
        },
      },
    },
    [
      {
        asset: {
          id: "action-2",
          type: "action",
          label: {
            asset: {
              id: "action-label-2",
              type: "text",
              value: "Clicked {{count2}} times",
            },
          },
        },
      },
      {
        asset: {
          id: "action-3",
          type: "action",
          label: {
            asset: {
              id: "action-label-3",
              type: "text",
              value: "Clicked {{count2}} times",
            },
          },
        },
      },
    ]
  ],
}

const nestedActionsFlattened = {
  id: "action",
  type: "collection",
  values: [
    {
      asset: {
        id: "action-1",
        type: "action",
        label: {
          asset: {
            id: "action-label-1",
            type: "text",
            value: "Clicked {{count1}} times",
          },
        },
      },
    },
    {
      flatten: true,
      values: [
        {
          asset: {
            id: "action-2",
            type: "action",
            label: {
              asset: {
                id: "action-label-2",
                type: "text",
                value: "Clicked {{count2}} times",
              },
            },
          },
        },
        {
          asset: {
            id: "action-3",
            type: "action",
            label: {
              asset: {
                id: "action-label-3",
                type: "text",
                value: "Clicked {{count2}} times",
              },
            },
          },
        },
      ]
    },
  ],
}

describe("resolver", () => {
  it("works with child dependencies", () => {
    const model = new LocalModel({
      count1: 0,
      count2: 0,
    });
    const parser = new Parser();
    const bindingParser = new BindingParser();
    const count1Binding = bindingParser.parse("count1");
    const count2Binding = bindingParser.parse("count2");
    const rootNode = parser.parseObject(actions);

    const resolver = new Resolver(rootNode!, {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
    });

    new StringResolverPlugin().applyResolver(resolver);

    const firstUpdate = resolver.update();

    expect(firstUpdate).toStrictEqual({
      id: "action",
      type: "collection",
      values: [
        {
          asset: {
            id: "action-1",
            type: "action",
            label: {
              asset: {
                id: "action-label-1",
                type: "text",
                value: "Clicked 0 times",
              },
            },
          },
        },
        {
          asset: {
            id: "action-2",
            type: "action",
            label: {
              asset: {
                id: "action-label-2",
                type: "text",
                value: "Clicked 0 times",
              },
            },
          },
        },
      ],
    });

    model.set([[count1Binding, 1]]);
    const secondUpdate = resolver.update(new Set([count1Binding]));
    expect(secondUpdate).toStrictEqual({
      id: "action",
      type: "collection",
      values: [
        {
          asset: {
            id: "action-1",
            type: "action",
            label: {
              asset: {
                id: "action-label-1",
                type: "text",
                value: "Clicked 1 times",
              },
            },
          },
        },
        {
          asset: {
            id: "action-2",
            type: "action",
            label: {
              asset: {
                id: "action-label-2",
                type: "text",
                value: "Clicked 0 times",
              },
            },
          },
        },
      ],
    });

    model.set([[count2Binding, 1]]);

    const thirdUpdate = resolver.update(new Set([count2Binding]));

    expect(thirdUpdate).toStrictEqual({
      id: "action",
      type: "collection",
      values: [
        {
          asset: {
            id: "action-1",
            type: "action",
            label: {
              asset: {
                id: "action-label-1",
                type: "text",
                value: "Clicked 1 times",
              },
            },
          },
        },
        {
          asset: {
            id: "action-2",
            type: "action",
            label: {
              asset: {
                id: "action-label-2",
                type: "text",
                value: "Clicked 1 times",
              },
            },
          },
        },
      ],
    });

    model.set([[count1Binding, 2]]);
    const fourthUpdate = resolver.update(new Set([count1Binding]));
    expect(fourthUpdate).toStrictEqual({
      id: "action",
      type: "collection",
      values: [
        {
          asset: {
            id: "action-1",
            type: "action",
            label: {
              asset: {
                id: "action-label-1",
                type: "text",
                value: "Clicked 2 times",
              },
            },
          },
        },
        {
          asset: {
            id: "action-2",
            type: "action",
            label: {
              asset: {
                id: "action-label-2",
                type: "text",
                value: "Clicked 1 times",
              },
            },
          },
        },
      ],
    });
  });

  it("tracks nested dependencies", () => {
    const view = {
      id: "collection",
      type: "collection",
      values: [
        {
          asset: {
            id: "value-1",
            type: "text",
            value: "Clicked {{stuff[{{count}}].value}} times",
          },
        },
      ],
    };
    const model = new LocalModel({
      stuff: [{ value: "first" }, { value: "second" }, { value: "third" }],
      count: 0,
    });
    const parser = new Parser();
    const bindingParser = new BindingParser({ get: model.get, set: model.set });

    const countBinding = bindingParser.parse("count");
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

    new StringResolverPlugin().applyResolver(resolver);

    const firstUpdate = resolver.update();
    expect(firstUpdate.values[0].asset.value).toBe("Clicked first times");

    model.set([[countBinding, 1]]);

    const secondUpdate = resolver.update(new Set([countBinding]));
    expect(secondUpdate.values[0].asset.value).toBe("Clicked second times");
  });
  it("resolves values in an array", () => {
    const view = {
      id: "custom",
      type: "custom",
      values: [0, 1],
    };
    const model = new LocalModel({
      stuff: [{ value: "first" }, { value: "second" }, { value: "third" }],
      count: 0,
    });
    const parser = new Parser();
    const bindingParser = new BindingParser({ get: model.get, set: model.set });

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

    new StringResolverPlugin().applyResolver(resolver);

    const firstUpdate = resolver.update();
    expect(firstUpdate.values).toStrictEqual([0, 1]);
  });

  it("works with expression strings in arrays", () => {
    const model = new LocalModel({
      showProgress1: false,
      showProgress2: true,
    });
    const parser = new Parser();
    const bindingParser = new BindingParser();
    const rootNode = parser.parseObject({
      id: "progress",
      type: "progress",
      progressAmount: [
        "@[ conditional({{showProgress1}}, 'local.progress', '') ]@",
        "@[ conditional({{showProgress2}}, 'local.progress', '') ]@",
      ],
    });

    const resolver = new Resolver(rootNode!, {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
    });

    new StringResolverPlugin().applyResolver(resolver);

    const firstUpdate = resolver.update();

    expect(firstUpdate).toStrictEqual({
      id: "progress",
      type: "progress",
      progressAmount: ["", "local.progress"],
    });
  });

  it("do not flatten nested array without marker", () => {
    const model = new LocalModel({
      count1: 0,
      count2: 0,
    });
    const parser = new Parser();
    const bindingParser = new BindingParser();
    const rootNode = parser.parseObject(nestedActions);

    const resolver = new Resolver(rootNode!, {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
    });

    new StringResolverPlugin().applyResolver(resolver);

    const firstUpdate = resolver.update();

    expect(firstUpdate).toStrictEqual({
      id: "action",
      type: "collection",
      values: [
        {
          asset: {
            id: "action-1",
            type: "action",
            label: {
              asset: {
                id: "action-label-1",
                type: "text",
                value: "Clicked 0 times",
              },
            },
          },
        },
        [
          {
            asset: {
              id: 'action-2',
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
          {
            asset: {
              id: 'action-3',
              type: 'action',
              label: {
                asset: {
                  id: 'action-label-3',
                  type: 'text',
                  value: 'Clicked 0 times',
                },
              },
            },
          },
        ],
      ],
    });
  })
  it("flattens nested array with marker", () => {
    const model = new LocalModel({
      count1: 0,
      count2: 0,
    });
    const parser = new Parser();
    const bindingParser = new BindingParser();
    const rootNode = parser.parseObject(nestedActionsFlattened);

    const resolver = new Resolver(rootNode!, {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
    });

    new StringResolverPlugin().applyResolver(resolver);

    const firstUpdate = resolver.update();

    expect(firstUpdate).toStrictEqual({
      id: "action",
      type: "collection",
      values: [
        {
          asset: {
            id: "action-1",
            type: "action",
            label: {
              asset: {
                id: "action-label-1",
                type: "text",
                value: "Clicked 0 times",
              },
            },
          },
        },
        {
          asset: {
            id: 'action-2',
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
        {
          asset: {
            id: 'action-3',
            type: 'action',
            label: {
              asset: {
                id: 'action-label-3',
                type: 'text',
                value: 'Clicked 0 times',
              },
            },
          },
        },
      ],
    });
  })
});
