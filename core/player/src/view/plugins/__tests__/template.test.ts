import { describe, it, expect, beforeEach } from "vitest";
import { BindingParser } from "../../../binding";
import type { DataModelWithParser } from "../../../data";
import { LocalModel, withParser } from "../../../data";
import { ExpressionEvaluator } from "../../../expressions";
import { SchemaController } from "../../../schema";
import { Parser } from "../../parser";
import { ViewInstance } from "../../view";
import type { Options } from "../options";
import { TemplatePlugin, MultiNodePlugin, AssetPlugin } from "../";
import { StringResolverPlugin, toNodeResolveOptions } from "../..";
import type { View } from "@player-ui/types";

const templateJoinValues = {
  id: "generated-flow",
  views: [
    {
      id: "collection",
      type: "collection",
      template: [
        {
          data: "foo",
          output: "values",
          value: {
            asset: {
              id: "value-_index_",
              type: "text",
              value: "item {{foo._index_}}",
            },
          },
        },
      ],
      values: [
        {
          asset: {
            id: "value-2",
            type: "text",
            value: "First value in the collection",
          },
        },
        {
          asset: {
            id: "value-3",
            type: "text",
            value: "Second value in the collection",
          },
        },
      ],
    },
    {
      id: "collection",
      type: "collection",
      values: [
        {
          asset: {
            id: "value-2",
            type: "text",
            value: "First value in the collection",
          },
        },
        {
          asset: {
            id: "value-3",
            type: "text",
            value: "Second value in the collection",
          },
        },
      ],
      template: [
        {
          data: "foo",
          output: "values",
          value: {
            asset: {
              id: "value-_index_",
              type: "text",
              value: "item {{foo._index_}}",
            },
          },
        },
      ],
    },
  ],
  data: {
    foo: [1, 2],
  },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "collection",
        transitions: {
          "*": "END_Done",
        },
      },
      END_Done: {
        state_type: "END",
        outcome: "done",
      },
    },
  },
};

const parseBinding = new BindingParser().parse;

describe("templates", () => {
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
    new AssetPlugin().applyParser(parser);
  });

  it("works with simple ones", () => {
    const petNames = ["Ginger", "Daisy", "Afra"];
    model.set([["foo.bar", petNames]]);

    expect(
      parser.parseObject({
        id: "foo",
        type: "collection",
        template: [
          {
            data: "foo.bar",
            output: "values",
            value: {
              value: "{{foo.bar._index_}}",
            },
          },
        ],
      }),
    ).toMatchSnapshot();
  });

  it("works with nested templates", () => {
    const petNames = ["Ginger", "Daisy", "Afra"];
    model.set([["foo.pets", petNames]]);

    const peopleNames = ["Adam", "Jenny"];
    model.set([["foo.people", peopleNames]]);

    expect(
      parser.parseObject({
        id: "foo",
        type: "collection",
        template: [
          {
            data: "foo.pets",
            output: "values",
            value: {
              asset: {
                type: "collection",
                id: "outer-collection-_index_",
                template: [
                  {
                    data: "foo.people",
                    output: "values",
                    value: {
                      text: "{{foo.pets._index_}} + {{foo.people._index1_}}",
                    },
                  },
                ],
              },
            },
          },
        ],
      }),
    ).toMatchSnapshot();
  });
});

describe("dynamic templates", () => {
  it("static - nodes are not updated", () => {
    const petNames = ["Ginger", "Vokey"];
    const model = withParser(new LocalModel({}), parseBinding);
    const evaluator = new ExpressionEvaluator({ model });
    const schema = new SchemaController();

    const view = new ViewInstance(
      {
        id: "my-view",
        asset: {
          id: "foo",
          type: "collection",
          template: [
            {
              dynamic: false,
              data: "foo.bar",
              output: "values",
              value: {
                value: "{{foo.bar._index_}}",
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
      },
    );

    const pluginOptions = toNodeResolveOptions(view.resolverOptions);
    new TemplatePlugin(pluginOptions).apply(view);
    new StringResolverPlugin().apply(view);

    model.set([["foo.bar", petNames]]);

    const resolved = view.update();

    expect(resolved).toStrictEqual({
      id: "my-view",
      asset: {
        id: "foo",
        type: "collection",
        values: ["Ginger", "Vokey"].map((value) => ({ value })),
      },
    });

    model.set([["foo.bar", ["Ginger", "Vokey", "Harry"]]]);

    let updated = view.update();
    expect(updated).toStrictEqual({
      id: "my-view",
      asset: {
        id: "foo",
        type: "collection",
        values: ["Ginger", "Vokey"].map((value) => ({ value })),
      },
    });

    model.set([["foo.bar", ["Ginger"]]]);
    updated = view.update();
    expect(updated).toStrictEqual({
      id: "my-view",
      asset: {
        id: "foo",
        type: "collection",
        values: ["Ginger", undefined].map((value) => ({ value })),
      },
    });
  });

  it("dynamic - nodes are updated", () => {
    const petNames = ["Ginger", "Vokey"];
    const model = withParser(new LocalModel({}), parseBinding);
    const evaluator = new ExpressionEvaluator({ model });
    const schema = new SchemaController();

    const view = new ViewInstance(
      {
        id: "my-view",
        asset: {
          id: "foo",
          type: "collection",
          template: [
            {
              dynamic: true,
              data: "foo.bar",
              output: "values",
              value: {
                value: "{{foo.bar._index_}}",
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
      },
    );

    const pluginOptions = toNodeResolveOptions(view.resolverOptions);
    new TemplatePlugin(pluginOptions).apply(view);
    new StringResolverPlugin().apply(view);

    model.set([["foo.bar", petNames]]);

    const resolved = view.update();

    expect(resolved).toStrictEqual({
      id: "my-view",
      asset: {
        id: "foo",
        type: "collection",
        values: ["Ginger", "Vokey"].map((value) => ({ value })),
      },
    });

    const barBinding = parseBinding("foo.bar");
    model.set([[barBinding, ["Vokey", "Louis", "Bob"]]]);

    let updated = view.update();
    expect(updated).toStrictEqual({
      id: "my-view",
      asset: {
        id: "foo",
        type: "collection",
        values: ["Vokey", "Louis", "Bob"].map((value) => ({ value })),
      },
    });

    model.set([[barBinding, ["Nuri"]]]);
    updated = view.update();
    expect(updated).toStrictEqual({
      id: "my-view",
      asset: {
        id: "foo",
        type: "collection",
        values: ["Nuri"].map((value) => ({ value })),
      },
    });
  });

  describe("Works with template items plus value items", () => {
    const model = withParser(
      new LocalModel(templateJoinValues.data),
      parseBinding,
    );
    const evaluator = new ExpressionEvaluator({ model });

    it("Should show template item first when coming before values on lexical order", () => {
      const view = new ViewInstance(templateJoinValues.views[0] as View, {
        model,
        parseBinding,
        evaluator,
        schema: new SchemaController(),
      });

      const pluginOptions = toNodeResolveOptions(view.resolverOptions);
      new AssetPlugin().apply(view);
      new TemplatePlugin(pluginOptions).apply(view);
      new StringResolverPlugin().apply(view);
      new MultiNodePlugin().apply(view);

      const resolved = view.update();

      expect(resolved.values).toHaveLength(4);
      expect(resolved.values).toMatchSnapshot();
    });
    it("Should show template item last when coming after values on lexical order", () => {
      const view = new ViewInstance(templateJoinValues.views[1] as View, {
        model,
        parseBinding,
        evaluator,
        schema: new SchemaController(),
      });

      const pluginOptions = toNodeResolveOptions(view.resolverOptions);
      new AssetPlugin().apply(view);
      new TemplatePlugin(pluginOptions).apply(view);
      new StringResolverPlugin().apply(view);
      new MultiNodePlugin().apply(view);

      const resolved = view.update();

      expect(resolved.values).toHaveLength(4);
      expect(resolved.values).toMatchSnapshot();
    });
  });
});

// describe("template placement", () => {
//   let model: DataModelWithParser;
//   let expressionEvaluator: ExpressionEvaluator;
//   let options: Options;
//   let parser: Parser;

//   beforeEach(() => {
//     model = withParser(new LocalModel(), parseBinding);
//     expressionEvaluator = new ExpressionEvaluator({
//       model,
//     });
//     parser = new Parser();
//     options = {
//       evaluate: expressionEvaluator.evaluate,
//       schema: new SchemaController(),
//       data: {
//         format: (binding, val) => val,
//         formatValue: (val) => val,
//         model,
//       },
//     };
//     new TemplatePlugin(options).applyParser(parser);
//     new AssetPlugin().applyParser(parser);
//   });

//   it("works with template position prepend", () => {
//     const testData = {
//       id: "test-view",
//       type: "collection",
//       template: [
//         {
//           data: "items",
//           output: "values",
//           placement: "prepend",
//           value: {
//             value: "item-{{items._index_}}",
//           },
//         },
//       ],
//       values: [{ value: "existing-item" }],
//     };

//     model.set([["items", ["a", "b", "c"]]]);

//     const parsed = parser.parseObject(testData);

//     expect(parsed).toMatchSnapshot();
//   });
// });
