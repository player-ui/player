import { describe, expect, beforeEach, test } from "vitest";
import { BindingParser } from "../../../binding";
import { LocalModel, withParser } from "../../../data";
import { SchemaController } from "../../../schema";
import { NodeType, Parser } from "../index";
import {
  SwitchPlugin,
  ApplicabilityPlugin,
  TemplatePlugin,
  MultiNodePlugin,
  AssetPlugin,
} from "../..";
import type { Options } from "../../plugins/options";
import { ExpressionEvaluator } from "../../../expressions";
import type { DataModelWithParser } from "../../../data";

const parseBinding = new BindingParser().parse;
describe("generates the correct AST", () => {
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
    new AssetPlugin().applyParser(parser);
    new TemplatePlugin(options).applyParser(parser);
    new ApplicabilityPlugin().applyParser(parser);
    new SwitchPlugin(options).applyParser(parser);
    new MultiNodePlugin().applyParser(parser);
  });

  test("works with basic objects", () => {
    expect(parser.parseObject({ foo: "bar" })).toStrictEqual({
      type: NodeType.Value,
      value: {
        foo: "bar",
      },
    });
  });

  test("works with objects that have symbols", () => {
    const testSymbol = Symbol("foo");
    expect(parser.parseObject({ [testSymbol]: "bar" })).toStrictEqual({
      type: NodeType.Value,
      value: {
        [testSymbol]: "bar",
      },
    });
  });

  test("works with applicability things", () => {
    expect(
      parser.parseObject({ foo: "bar", applicability: "{{baz}}" }),
    ).toMatchSnapshot();

    expect(
      parser.parseObject({
        asset: {
          values: [
            {
              applicability: "{{foo}}",
              value: "foo",
            },
            {
              value: "bar",
            },
          ],
        },
      }),
    ).toMatchSnapshot();

    expect(
      parser.parseObject({
        asset: {
          someProp: {
            applicability: "{{foo}}",
            label: {
              value: "label",
            },
            description: {
              value: "description",
            },
          },
        },
      }),
    ).toMatchSnapshot();

    expect(
      parser.parseObject({
        asset: {
          someProp: {
            asset: {
              applicability: "{{foo}}",
              type: "someAsset",
            },
          },
        },
      }),
    ).toMatchSnapshot();
  });

  test("parses an object", () => {
    expect(parser.parseObject({ asset: { type: "bar" } })).toMatchSnapshot();
  });

  test("parses an exp array", () => {
    expect(
      parser.parseObject(
        {
          id: "foo",
          type: "action",
          exp: ['{{please}} = "work"'],
        },
        NodeType.Asset,
      ),
    ).toMatchSnapshot();
  });

  test("keeps null values when parsing object", () => {
    expect(parser.parseObject({ foo: "bar", baz: null })).toStrictEqual({
      type: NodeType.Value,
      value: {
        foo: "bar",
        baz: null,
      },
    });
  });
});

describe("parseView", () => {
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
    new AssetPlugin().applyParser(parser);
    new TemplatePlugin(options).applyParser(parser);
    new ApplicabilityPlugin().applyParser(parser);
    new MultiNodePlugin().applyParser(parser);
    new SwitchPlugin(options).applyParser(parser);
  });

  test("parses a simple view", () => {
    expect(
      parser.parseView({
        id: "foo-view",
        type: "viewtype",
        fields: {
          asset: {
            id: "foo-asset",
            type: "collection",
            values: [
              {
                asset: {
                  id: "text-asset",
                  type: "text",
                  value: "bar",
                },
              },
              {
                asset: {
                  applicability: "foo.bar",
                  id: "input-asset",
                  type: "input",
                },
              },
              {},
            ],
          },
        },
      } as any),
    ).toMatchSnapshot();
  });
});

describe("generates the correct AST when using switch plugin", () => {
  const toughStaticSwitchView = {
    id: "toughView",
    type: "view",
    title: {
      staticSwitch: [
        {
          case: "'true'",
          asset: {
            id: "businessprofile-tile-screen-yoy-subtitle",
            type: "text",
            value:
              "If it's changed since last year, let us know. Feel free to pick more than one.",
          },
        },
      ],
    },
  };

  const toughStaticSwitchMultiNodeView = {
    id: "toughView",
    type: "view",
    title: {
      asset: {
        id: "someMultiNode",
        type: "type",
        values: [
          {
            staticSwitch: [
              {
                case: "'true'",
                asset: {
                  id: "businessprofile-tile-screen-yoy-subtitle-1",
                  type: "text",
                  value:
                    "If it's changed since last year, let us know. Feel free to pick more than one.",
                },
              },
            ],
          },
          {
            asset: {
              id: "businessprofile-tile-screen-yoy-subtitle-2",
              type: "text",
              value: "More text",
            },
          },
        ],
      },
    },
  };

  const switchPlugin = new SwitchPlugin({
    evaluate: () => {
      return true;
    },
  } as any);
  const multiNodePlugin = new MultiNodePlugin();
  const assetPlugin = new AssetPlugin();

  const parser = new Parser();
  switchPlugin.applyParser(parser);
  multiNodePlugin.applyParser(parser);
  assetPlugin.applyParser(parser);

  test("works with asset wrapped objects", () => {
    expect(parser.parseObject(toughStaticSwitchView)).toMatchSnapshot();
  });

  test("works with objects in a multiNode", () => {
    expect(
      parser.parseObject(toughStaticSwitchMultiNodeView),
    ).toMatchSnapshot();
  });

  const multinodeViewWithFlatten = {
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
        ],
      },
    ],
  };
  test("work with objects with flatten marker in a multiNode", () => {
    expect(parser.parseObject(multinodeViewWithFlatten)).toMatchSnapshot();
  });

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
      ],
    ],
  };

  test("work with objects without flatten marker in a multiNode", () => {
    expect(parser.parseObject(nestedActions)).toMatchSnapshot();
  });
});
