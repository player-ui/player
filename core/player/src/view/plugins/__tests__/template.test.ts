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

  it("works with static nested templates", () => {
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

  describe("works with data changes as expected", () => {
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
  });

  describe("Works with template items plus value items", () => {
    const model = withParser(
      new LocalModel(templateJoinValues.data),
      parseBinding,
    );
    const evaluator = new ExpressionEvaluator({ model });

    it("Should show static template item first when coming before values on lexical order", () => {
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
    it("Should show static template item last when coming after values on lexical order", () => {
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
    it("Should show static template items last when using placement append", () => {
      const viewWithAppend = {
        ...templateJoinValues.views[0],
        template: [
          {
            ...templateJoinValues.views[0]?.template[0],
            placement: "append",
          },
        ],
      };

      const view = new ViewInstance(viewWithAppend as View, {
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

      // Verify the order: first the non-template values, then the template values
      expect(resolved.values[0].asset.id).toBe("value-2");
      expect(resolved.values[0].asset.value).toBe(
        "First value in the collection",
      );

      expect(resolved.values[1].asset.id).toBe("value-3");
      expect(resolved.values[1].asset.value).toBe(
        "Second value in the collection",
      );

      expect(resolved.values).toHaveLength(4);
      expect(resolved.values).toMatchSnapshot();
    });

    it("Should show static template items first when using placement prepend", () => {
      const viewWithPrepend = {
        ...templateJoinValues.views[1],
        template: [
          {
            ...templateJoinValues.views[1]?.template[0],
            placement: "prepend",
          },
        ],
      };

      const view = new ViewInstance(viewWithPrepend as View, {
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

      // Verify the order: first the template values, then the non-template values
      expect(resolved.values[0].asset.id).toBe("value-0");
      expect(resolved.values[0].asset.value).toBe("item 1");

      expect(resolved.values[1].asset.id).toBe("value-1");
      expect(resolved.values[1].asset.value).toBe("item 2");

      expect(resolved.values).toHaveLength(4);
      expect(resolved.values).toMatchSnapshot();
    });
    it("Should show dynamic template items last when using placement append", () => {
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
                placement: "append",
                value: {
                  asset: {
                    id: "dynamic-_index_",
                    type: "text",
                    value: "item {{foo.bar._index_}}",
                  },
                },
              },
            ],
            values: [
              {
                asset: {
                  id: "value-1",
                  type: "text",
                  value: "First value in the collection",
                },
              },
              {
                asset: {
                  id: "value-2",
                  type: "text",
                  value: "Second value in the collection",
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
      new AssetPlugin().apply(view);
      new MultiNodePlugin().apply(view);

      model.set([["foo.bar", petNames]]);

      const resolved = view.update();
      expect(resolved.asset.values).toHaveLength(4);
      expect(resolved.asset.values[2].asset.value).toBe("item Ginger");
      expect(resolved.asset.values[3].asset.value).toBe("item Vokey");

      const barBinding = parseBinding("foo.bar");
      model.set([[barBinding, ["Louis", "Bob", "Nuri"]]]);

      const updated = view.update();
      expect(updated.asset.values).toHaveLength(5);
      expect(updated.asset.values[2].asset.value).toBe("item Louis");
      expect(updated.asset.values[3].asset.value).toBe("item Bob");
      expect(updated.asset.values[4].asset.value).toBe("item Nuri");
    });
    it("Should show dynamic template items first when using placement prepend", () => {
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
            values: [
              {
                asset: {
                  id: "value-1",
                  type: "text",
                  value: "First value in the collection",
                },
              },
              {
                asset: {
                  id: "value-2",
                  type: "text",
                  value: "Second value in the collection",
                },
              },
            ],
            template: [
              {
                dynamic: true,
                data: "foo.bar",
                output: "values",
                placement: "prepend",
                value: {
                  asset: {
                    id: "dynamic-_index_",
                    type: "text",
                    value: "item {{foo.bar._index_}}",
                  },
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
      new AssetPlugin().apply(view);
      new MultiNodePlugin().apply(view);

      model.set([["foo.bar", petNames]]);

      const resolved = view.update();
      expect(resolved.asset.values).toHaveLength(4);
      expect(resolved.asset.values).toMatchSnapshot();
      expect(resolved.asset.values[0].asset.value).toBe("item Ginger");
      expect(resolved.asset.values[1].asset.value).toBe("item Vokey");

      // Test that dynamic updates maintain the correct order
      const barBinding = parseBinding("foo.bar");
      model.set([[barBinding, ["Louis", "Bob", "Nuri"]]]);

      const updated = view.update();
      expect(updated.asset.values).toMatchSnapshot();
      expect(updated.asset.values).toHaveLength(5);
      expect(updated.asset.values[0].asset.value).toBe("item Louis");
      expect(updated.asset.values[1].asset.value).toBe("item Bob");
      expect(updated.asset.values[2].asset.value).toBe("item Nuri");
    });
    it("Should support placement for both static and dynamic templates", () => {
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
                placement: "append",
                value: {
                  asset: {
                    id: "dynamic-_index_",
                    type: "text",
                    value: "dynamic {{foo.bar._index_}}",
                  },
                },
              },
              {
                dynamic: false,
                data: "foo.bar",
                output: "values",
                placement: "prepend",
                value: {
                  asset: {
                    id: "static-_index_",
                    type: "text",
                    value: "static {{foo.bar._index_}}",
                  },
                },
              },
            ],
            values: [
              {
                asset: {
                  id: "value-1",
                  type: "text",
                  value: "First value in the collection",
                },
              },
              {
                asset: {
                  id: "value-2",
                  type: "text",
                  value: "Second value in the collection",
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
      new AssetPlugin().apply(view);
      new MultiNodePlugin().apply(view);

      model.set([["foo.bar", petNames]]);

      const resolved = view.update();
      expect(resolved.asset.values).toMatchSnapshot();
      expect(resolved.asset.values).toHaveLength(6);
      // Prepend first - static template
      expect(resolved.asset.values[0].asset.value).toBe("static Ginger");
      expect(resolved.asset.values[1].asset.value).toBe("static Vokey");
      // Non-template data
      expect(resolved.asset.values[2].asset.value).toBe(
        "First value in the collection",
      );
      expect(resolved.asset.values[3].asset.value).toBe(
        "Second value in the collection",
      );
      // Append last - dynamic template
      expect(resolved.asset.values[4].asset.value).toBe("dynamic Ginger");
      expect(resolved.asset.values[5].asset.value).toBe("dynamic Vokey");

      const barBinding = parseBinding("foo.bar");
      model.set([[barBinding, ["Louis", "Bob", "Nuri"]]]);

      const updated = view.update();
      expect(updated.asset.values).toMatchSnapshot();
      expect(updated.asset.values).toHaveLength(7);
      expect(updated.asset.values[4].asset.value).toBe("dynamic Louis");
      expect(updated.asset.values[5].asset.value).toBe("dynamic Bob");
      expect(updated.asset.values[6].asset.value).toBe("dynamic Nuri");
    });
  });

  it("Should preserve order when multiple templates have the same placement", () => {
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
              data: "first.data",
              output: "values",
              placement: "append", // Both templates have "append" placement
              value: {
                asset: {
                  id: "first-_index_",
                  type: "text",
                  value: "first {{first.data._index_}}",
                },
              },
            },
            {
              dynamic: true,
              data: "second.data",
              output: "values",
              placement: "append", // Both templates have "append" placement
              value: {
                asset: {
                  id: "second-_index_",
                  type: "text",
                  value: "second {{second.data._index_}}",
                },
              },
            },
          ],
          values: [
            {
              asset: {
                id: "static-value",
                type: "text",
                value: "Static value in the collection",
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
    new AssetPlugin().apply(view);
    new MultiNodePlugin().apply(view);

    // Set data for both template data sources
    model.set([
      ["first.data", ["A", "B"]],
      ["second.data", ["C", "D"]],
    ]);

    const resolved = view.update();

    // We should have 5 values total:
    // 1 static value + 2 values from first.data + 2 values from second.data
    expect(resolved.asset.values).toHaveLength(5);

    // Static value should be first
    expect(resolved.asset.values[0].asset.id).toBe("static-value");
    expect(resolved.asset.values[0].asset.value).toBe(
      "Static value in the collection",
    );

    // Then first.data template items (in their original order)
    expect(resolved.asset.values[1].asset.id).toBe("first-0");
    expect(resolved.asset.values[1].asset.value).toBe("first A");
    expect(resolved.asset.values[2].asset.id).toBe("first-1");
    expect(resolved.asset.values[2].asset.value).toBe("first B");

    // Then second.data template items
    expect(resolved.asset.values[3].asset.id).toBe("second-0");
    expect(resolved.asset.values[3].asset.value).toBe("second C");
    expect(resolved.asset.values[4].asset.id).toBe("second-1");
    expect(resolved.asset.values[4].asset.value).toBe("second D");

    // Make sure the ordering is preserved in the snapshot
    expect(resolved.asset.values).toMatchSnapshot();
  });
});
