import { describe, it, expect, beforeEach } from "vitest";
import { BindingParser } from "../../../binding";
import type { DataModelWithParser } from "../../../data";
import { LocalModel, withParser } from "../../../data";
import { ExpressionEvaluator } from "../../../expressions";
import { SchemaController } from "../../../schema";
import type { Resolve } from "../../resolver";
import { Resolver } from "../../resolver";
import type { Node } from "../../parser";
import { Parser } from "../../parser";
import { ApplicabilityPlugin, MultiNodePlugin, StringResolverPlugin } from "..";

const parseBinding = new BindingParser().parse;

describe("applicability", () => {
  let model: DataModelWithParser; // need
  let expressionEvaluator: ExpressionEvaluator; // depends on how applicability is changed?
  let resolverOptions: Resolve.ResolverOptions;
  let parser: Parser;

  beforeEach(() => {
    model = withParser(new LocalModel(), parseBinding);
    expressionEvaluator = new ExpressionEvaluator({
      model,
    });
    parser = new Parser();

    resolverOptions = {
      evaluator: expressionEvaluator,
      parseBinding,
      model,
      parseNode: parser.parseObject.bind(parser),
      schema: new SchemaController(),
    };
  });

  it("undefined does not remove asset", () => {
    const aP = new ApplicabilityPlugin();
    const sP = new StringResolverPlugin();
    const mnP = new MultiNodePlugin();

    aP.applyParser(parser);
    mnP.applyParser(parser);

    const root = parser.parseObject({
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
    });

    const resolver = new Resolver(root as Node.Node, resolverOptions);

    aP.applyResolver(resolver);
    sP.applyResolver(resolver);

    expect(resolver.update()).toStrictEqual({
      asset: { values: [{ value: "foo" }, { value: "bar" }] },
    });
    model.set([["foo", false]]);
    expect(resolver.update()).toStrictEqual({
      asset: { values: [{ value: "bar" }] },
    });
  });

  it("removes empty objects", () => {
    new ApplicabilityPlugin().applyParser(parser);
    new MultiNodePlugin().applyParser(parser);
    const root = parser.parseObject({
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
    });
    model.set([["foo", true]]);
    const resolver = new Resolver(root as Node.Node, resolverOptions);

    new ApplicabilityPlugin().applyResolver(resolver);
    new StringResolverPlugin().applyResolver(resolver);

    expect(resolver.update()).toStrictEqual({
      asset: { values: [{ value: "foo" }, { value: "bar" }] },
    });

    model.set([["foo", false]]);
    expect(resolver.update()).toStrictEqual({
      asset: { values: [{ value: "bar" }] },
    });
  });

  it("removes asset wrappers", () => {
    new ApplicabilityPlugin().applyParser(parser);
    const root = parser.parseObject({
      asset: {
        title: {
          applicability: "{{foo}}",
          asset: {
            value: "foo",
          },
        },
        value: "Hello World",
      },
    });
    model.set([["foo", true]]);
    const resolver = new Resolver(root as Node.Node, resolverOptions);

    new ApplicabilityPlugin().applyResolver(resolver);
    new StringResolverPlugin().applyResolver(resolver);

    expect(resolver.update()).toStrictEqual({
      asset: { title: { asset: { value: "foo" } }, value: "Hello World" },
    });
    model.set([["foo", false]]);
    expect(resolver.update()).toStrictEqual({
      asset: { value: "Hello World" },
    });
  });

  it("handles empty models", () => {
    new ApplicabilityPlugin().applyParser(parser);
    const root = parser.parseObject({
      asset: {
        values: [
          {
            asset: {
              id: "some-asset-1",
              type: "text",
            },
          },
          {
            asset: {
              id: "some-asset-2",
              type: "text",
              applicability: "{{foo}} == true",
              value: "foo",
              label: {
                asset: {
                  applicability: "{{bar}} == true",
                  value: "bar",
                },
              },
            },
          },
        ],
      },
    });
    const fooBinding = parseBinding("foo");
    const barBinding = parseBinding("bar");

    model.set([
      [fooBinding, true],
      [barBinding, true],
    ]);
    const resolver = new Resolver(root as Node.Node, resolverOptions);

    new ApplicabilityPlugin().applyResolver(resolver);
    new StringResolverPlugin().applyResolver(resolver);

    expect(resolver.update()).toStrictEqual({
      asset: {
        values: [
          {
            asset: {
              id: "some-asset-1",
              type: "text",
            },
          },
          {
            asset: {
              id: "some-asset-2",
              type: "text",
              value: "foo",
              label: { asset: { value: "bar" } },
            },
          },
        ],
      },
    });
    model.set([[fooBinding, false]]);
    expect(resolver.update(new Set([fooBinding]))).toStrictEqual({
      asset: {
        values: [
          {
            asset: {
              id: "some-asset-1",
              type: "text",
            },
          },
        ],
      },
    });

    model.set([[fooBinding, true]]);
    expect(resolver.update(new Set([fooBinding]))).toStrictEqual({
      asset: {
        values: [
          {
            asset: {
              id: "some-asset-1",
              type: "text",
            },
          },
          {
            asset: {
              id: "some-asset-2",
              type: "text",
              value: "foo",
              label: { asset: { value: "bar" } },
            },
          },
        ],
      },
    });

    model.set([[barBinding, false]]);
    expect(resolver.update(new Set([barBinding]))).toStrictEqual({
      asset: {
        values: [
          {
            asset: {
              id: "some-asset-1",
              type: "text",
            },
          },
          {
            asset: {
              id: "some-asset-2",
              type: "text",
              value: "foo",
            },
          },
        ],
      },
    });
  });

  it("does not return field object if applicability node does not resolve", () => {
    const applicabilityPlugin = new ApplicabilityPlugin();
    const stringResolverPlugin = new StringResolverPlugin();

    applicabilityPlugin.applyParser(parser);
    const root = parser.parseObject({
      id: "foo",
      fields: {
        applicability: "{{foo.bar}}",
      },
    } as any);
    const resolver = new Resolver(root as Node.Node, resolverOptions);

    applicabilityPlugin.applyResolver(resolver);
    stringResolverPlugin.applyResolver(resolver);

    const resolved = resolver.update();

    expect(resolved).toStrictEqual({
      id: "foo",
    });
  });
});
