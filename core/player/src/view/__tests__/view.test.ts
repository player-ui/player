import { describe, it, expect, test } from "vitest";
import { LocalModel, withParser } from "../../data";
import { ExpressionEvaluator } from "../../expressions";
import { BindingParser } from "../../binding";
import { SchemaController } from "../../schema";
import {
  StringResolverPlugin,
  SwitchPlugin,
  ViewInstance,
  toNodeResolveOptions,
} from "..";

const parseBinding = new BindingParser().parse;

describe("view", () => {
  describe("switch", () => {
    it("works on a static switch", () => {
      const model = withParser(
        new LocalModel({
          foo: {
            bar: true,
            baz: false,
          },
        }),
        parseBinding,
      );
      const evaluator = new ExpressionEvaluator({ model });
      const schema = new SchemaController();

      const view = new ViewInstance(
        {
          id: "foo",
          fields: {
            staticSwitch: [
              {
                case: "{{foo.baz}}",
                asset: {
                  id: "input-1",
                  type: "input",
                },
              },
              {
                case: "{{foo.bar}}",
                asset: {
                  id: "input-2",
                  type: "input",
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
      new SwitchPlugin(pluginOptions).apply(view);
      new StringResolverPlugin().apply(view);

      const resolved = view.update();

      expect(resolved).toStrictEqual({
        id: "foo",
        fields: {
          asset: {
            id: "input-2",
            type: "input",
          },
        },
      });

      const bazBinding = parseBinding("foo.baz");
      model.set([[bazBinding, true]]);

      const updated = view.update(new Set([bazBinding]));
      expect(updated).toBe(resolved);
    });

    it("does not return a field object if the case does not resolve an asset", () => {
      const model = withParser(
        new LocalModel({
          foo: {
            bar: true,
            baz: false,
          },
        }),
        parseBinding,
      );
      const evaluator = new ExpressionEvaluator({ model });
      const schema = new SchemaController();

      const view = new ViewInstance(
        {
          id: "foo",
          fields: {
            staticSwitch: [
              {
                case: "{{foo.baz}}",
                asset: {
                  id: "input-1",
                  type: "input",
                },
              },
              {
                case: "{{foo.bar}}",
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
      new SwitchPlugin(pluginOptions).apply(view);
      new StringResolverPlugin().apply(view);

      const resolved = view.update();

      expect(resolved).toStrictEqual({
        id: "foo",
      });

      const bazBinding = parseBinding("foo.baz");
      model.set([[bazBinding, true]]);

      const updated = view.update(new Set([bazBinding]));
      expect(updated).toBe(resolved);
    });

    it("works with default case", () => {
      const model = withParser(
        new LocalModel({
          foo: {
            baz: "bad",
          },
        }),
        parseBinding,
      );
      const evaluator = new ExpressionEvaluator({ model });
      const schema = new SchemaController();

      const view = new ViewInstance(
        {
          id: "foo",
          fields: {
            staticSwitch: [
              {
                case: '{{foo.baz}} === "good"',
                asset: {
                  id: "input-1",
                  type: "input",
                },
              },
              {
                case: true,
                asset: {
                  id: "input-2",
                  type: "input",
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
      new SwitchPlugin(pluginOptions).apply(view);
      new StringResolverPlugin().apply(view);

      const resolved = view.update();

      expect(resolved).toStrictEqual({
        id: "foo",
        fields: {
          asset: {
            id: "input-2",
            type: "input",
          },
        },
      });
    });

    it("works on a dynamic switch", () => {
      const model = withParser(
        new LocalModel({
          foo: {
            bar: true,
            baz: false,
          },
        }),
        parseBinding,
      );

      const evaluator = new ExpressionEvaluator({ model });
      const schema = new SchemaController();

      const view = new ViewInstance(
        {
          id: "foo",
          fields: {
            dynamicSwitch: [
              {
                case: "{{foo.baz}}",
                asset: {
                  id: "input-1",
                  type: "input",
                },
              },
              {
                case: "{{foo.bar}}",
                asset: {
                  id: "input-2",
                  type: "input",
                },
              },
            ],
          },
        } as any,
        {
          schema,
          model,
          parseBinding,
          evaluator,
        },
      );

      const pluginOptions = toNodeResolveOptions(view.resolverOptions);
      new SwitchPlugin(pluginOptions).apply(view);
      new StringResolverPlugin().apply(view);

      const resolved = view.update();

      expect(resolved).toStrictEqual({
        id: "foo",
        fields: {
          asset: {
            id: "input-2",
            type: "input",
          },
        },
      });

      const bazBinding = parseBinding("foo.baz");
      model.set([[bazBinding, true]]);

      const updated = view.update(new Set([bazBinding]));
      expect(updated).toStrictEqual({
        id: "foo",
        fields: {
          asset: {
            id: "input-1",
            type: "input",
          },
        },
      });
    });

    it("dynamic - works inside of an array", () => {
      const model = withParser(
        new LocalModel({
          foo: {
            baz: "bad",
          },
        }),
        parseBinding,
      );
      const evaluator = new ExpressionEvaluator({ model });
      const schema = new SchemaController();

      const view = new ViewInstance(
        {
          id: "foo",
          fields: {
            asset: {
              type: "collection",
              id: "collection",
              values: [
                {
                  dynamicSwitch: [
                    {
                      case: '{{foo.baz}} === "good"',
                      asset: {
                        id: "input-1",
                        type: "input",
                      },
                    },
                    {
                      case: '{{foo.baz}} === "bad"',
                      asset: {
                        id: "input-2",
                        type: "input",
                      },
                    },
                  ],
                },
                {
                  asset: {
                    id: "other-asset",
                    type: "text",
                    value: "other value",
                  },
                },
              ],
            },
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
      new SwitchPlugin(pluginOptions).apply(view);
      new StringResolverPlugin().apply(view);

      const resolved = view.update();

      expect(resolved).toStrictEqual({
        id: "foo",
        fields: {
          asset: {
            id: "collection",
            type: "collection",
            values: [
              {
                asset: {
                  id: "input-2",
                  type: "input",
                },
              },
              {
                asset: {
                  id: "other-asset",
                  type: "text",
                  value: "other value",
                },
              },
            ],
          },
        },
      });

      const bazBinding = parseBinding("foo.baz");
      model.set([[bazBinding, true]]);

      const updated = view.update(new Set([bazBinding]));
      expect(updated).toStrictEqual({
        id: "foo",
        fields: {
          asset: {
            id: "collection",
            type: "collection",
            values: [
              {
                asset: {
                  id: "other-asset",
                  type: "text",
                  value: "other value",
                },
              },
            ],
          },
        },
      });
    });

    it("static - works inside of an array", () => {
      const model = withParser(new LocalModel({}), parseBinding);
      const evaluator = new ExpressionEvaluator({ model });
      const schema = new SchemaController();

      const view = new ViewInstance(
        {
          id: "foo",
          fields: {
            asset: {
              type: "collection",
              id: "collection",
              values: [
                {
                  staticSwitch: [
                    {
                      case: true,
                      asset: {
                        id: "input-2",
                        type: "input",
                      },
                    },
                  ],
                },
                {
                  asset: {
                    id: "other-asset",
                    type: "text",
                    value: "other value",
                  },
                },
              ],
            },
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
      new SwitchPlugin(pluginOptions).apply(view);
      new StringResolverPlugin().apply(view);

      const resolved = view.update();

      expect(resolved).toStrictEqual({
        id: "foo",
        fields: {
          asset: {
            id: "collection",
            type: "collection",
            values: [
              {
                asset: {
                  id: "input-2",
                  type: "input",
                },
              },
              {
                asset: {
                  id: "other-asset",
                  type: "text",
                  value: "other value",
                },
              },
            ],
          },
        },
      });
    });
  });

  describe("string-updates", () => {
    it("works on expressions", () => {
      const model = withParser(
        new LocalModel({
          foo: {
            hello: "Hello",
            world: "World",
          },
        }),
        parseBinding,
      );
      const schema = new SchemaController();
      const evaluator = new ExpressionEvaluator({ model });

      const view = new ViewInstance(
        {
          id: "foo",
          fields: {
            asset: {
              id: "test",
              type: "text",
              value: 'Before @[ {{foo.hello}} + " " + {{foo.world}} ]@ After',
            },
          },
        } as any,
        {
          model,
          parseBinding,
          evaluator,
          schema,
        },
      );

      new StringResolverPlugin().apply(view);

      const resolved = view.update();

      expect(resolved).toStrictEqual({
        id: "foo",
        fields: {
          asset: {
            id: "test",
            type: "text",
            value: "Before Hello World After",
          },
        },
      });

      const worldBinding = parseBinding("foo.world");
      model.set([[worldBinding, "Adam"]]);

      const updated = view.update(new Set([worldBinding]));
      expect(updated).toStrictEqual({
        id: "foo",
        fields: {
          asset: {
            id: "test",
            type: "text",
            value: "Before Hello Adam After",
          },
        },
      });

      model.set([[parseBinding("foo.unrelated"), "other stuff"]]);
      expect(view.update(new Set([parseBinding("foo.unrelated")]))).toBe(
        updated,
      );
    });
  });

  test("handles a top level validation thats not an array", () => {
    const model = withParser(new LocalModel({}), parseBinding);
    const evaluator = new ExpressionEvaluator({ model });
    const schema = new SchemaController();

    const view = new ViewInstance(
      {
        id: "foo",
        validation: {
          broken: true,
        },
      } as any,
      {
        model,
        parseBinding,
        evaluator,
        schema,
      },
    );

    expect(view).toBeDefined();
  });
});
