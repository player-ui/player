import { test, expect, vitest } from "vitest";
import { LocalModel, withParser, PipelinedDataModel } from "../../data";
import { ExpressionEvaluator } from "../../expressions";
import { BindingParser } from "../../binding";
import { SchemaController } from "../../schema";
import { ApplicabilityPlugin, StringResolverPlugin, ViewInstance } from "..";
import { NodeType } from "../parser";

const parseBinding = new BindingParser().parse;
const fooBarBinding = parseBinding("foo.bar");

test("uses the exact same object if nothing changes", () => {
  const model = withParser(new LocalModel(), parseBinding);
  const evaluator = new ExpressionEvaluator({ model });
  const schema = new SchemaController();
  const view = new ViewInstance(
    {
      id: "foo",
      fields: {
        asset: {
          id: "input",
          type: "input",
          binding: "foo.bar",
        },
      },
    } as any,
    {
      model,
      parseBinding,
      evaluator,
      transition: () => undefined,
      schema,
    },
  );

  new StringResolverPlugin().apply(view);

  view.hooks.resolver.tap("input", (resolver) => {
    resolver.hooks.resolve.tap("input", (value, astNode, options) => {
      if (astNode.type === NodeType.Asset && astNode.value.type === "input") {
        return {
          ...value,
          set(newValue: any) {
            options.data.model.set({ [value.binding]: newValue } as any);
          },
          value: options.data.model.get(value.binding),
        };
      }
    });
  });

  const resolved = view.update();
  model.set([[fooBarBinding, true]]);
  const bazUpdate = view.update(new Set([parseBinding("foo.baz")]));

  expect(bazUpdate).toBe(resolved);

  model.set([[fooBarBinding, false]]);
  const barUpdate = view.update(new Set([parseBinding("foo.bar")]));
  expect(barUpdate).not.toBe(bazUpdate);
  expect(barUpdate.fields.asset.value).toBe(false);
});

test("applicability is immutable", () => {
  const model = withParser(
    new LocalModel({
      foo: {
        bar: true,
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
          id: "input",
          type: "input",
          applicability: "{{foo.bar}}",
        },
      },
    } as any,
    {
      model,
      evaluator,
      parseBinding,
      schema,
    },
  );

  new StringResolverPlugin().apply(view);
  new ApplicabilityPlugin().apply(view);

  const resolved = view.update();
  const batUpdate = view.update(new Set([parseBinding("foo.bat")]));

  expect(batUpdate.fields).toStrictEqual({
    asset: { id: "input", type: "input" },
  });
  expect(batUpdate).toBe(resolved);

  const firstUpdate = view.update(new Set([parseBinding("foo.bar")]));

  expect(firstUpdate).not.toBe(resolved);

  model.set([["foo", { bar: false }]]);

  const secondUpdate = view.update(new Set([parseBinding("foo.bar")]));

  expect(secondUpdate.fields).not.toBeDefined();
  expect(secondUpdate).not.toBe(firstUpdate);
  expect(secondUpdate).not.toBe(resolved);
  expect(secondUpdate).not.toBe(batUpdate);
});

test("binding normalization", () => {
  const model = new PipelinedDataModel([
    new LocalModel({
      baz: 10,
      foo: [
        {
          enabled: false,
          bar: 20,
        },
        {
          enabled: false,
          bar: 10,
        },
      ],
    }),
  ]);
  const evaluator = new ExpressionEvaluator({ model });
  const schema = new SchemaController();

  const view = new ViewInstance(
    {
      id: "foo",
      fields: {
        asset: {
          id: "input",
          type: "input",
          binding: "foo[bar={{baz}}].enabled",
        },
      },
    } as any,
    {
      model,
      evaluator,
      parseBinding,
      schema,
    },
  );

  new StringResolverPlugin().apply(view);

  const resolved = view.update();
  let barUpdate = view.update(new Set([parseBinding("boo")]));

  expect(barUpdate).toBe(resolved);

  model.set([[parseBinding("baz"), 20]]);
  barUpdate = view.update(new Set([parseBinding("baz")]));

  expect(barUpdate.fields.asset.binding).not.toBe("foo[bar={{baz}}].enabled");
  expect(barUpdate.fields.asset.binding).not.toBe(
    resolved.fields.asset.binding,
  );
});

test("hardcore immutability", () => {
  const model = withParser(
    new LocalModel({
      foo: {
        bar: {
          baz: "100!",
        },
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
          id: "input",
          type: "text",
          value: "{{foo.bar.baz}}",
        },
      },
    } as any,
    {
      model,
      evaluator,
      parseBinding,
      schema,
    },
  );

  new StringResolverPlugin().apply(view);

  const resolved = view.update();

  let barUpdate = view.update(new Set([parseBinding("boo")]));

  expect(barUpdate).toBe(resolved);

  barUpdate = view.update(new Set([parseBinding("foo")]));

  expect(barUpdate).not.toBe(resolved);

  model.set([["foo.bar.baz", 20]]);
  barUpdate = view.update(new Set([parseBinding("foo")]));

  expect(barUpdate.fields.asset.value).toBe(20);
});

test("should only update if data is used in view", () => {
  const model = withParser(
    new LocalModel({
      foo: {
        bar: {
          baz: "100!",
        },
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
          id: "input",
          type: "text",
          value: "A",
        },
      },
    } as any,
    {
      model,
      evaluator,
      parseBinding,
      schema,
    },
  );

  new StringResolverPlugin().apply(view);

  const hook = vitest.fn();
  view.hooks.onUpdate.tap("update", hook);

  model.set([["foo.bar.baz", 20]]);
  view.update(new Set([parseBinding("foo.bar.baz")]));
  model.set([["foo.bar.baz", 30]]);
  view.update(new Set([parseBinding("foo.bar.baz")]));

  expect(hook.mock.calls).toHaveLength(1);
});
