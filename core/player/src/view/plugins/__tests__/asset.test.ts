import { describe, it, expect, beforeEach } from "vitest";
import { BindingParser } from "../../../binding";
import type { DataModelWithParser } from "../../../data";
import { LocalModel, withParser } from "../../../data";
import { ExpressionEvaluator } from "../../../expressions";
import { SchemaController } from "../../../schema";
import { Parser } from "../../parser";
import type { Options } from "../options";
import {
  MultiNodePlugin,
  AssetPlugin,
  ApplicabilityPlugin,
  TemplatePlugin,
  SwitchPlugin,
} from "..";

const parseBinding = new BindingParser().parse;

describe("asset", () => {
  let parser: Parser;

  beforeEach(() => {
    parser = new Parser();
    new AssetPlugin().applyParser(parser);
  });

  it("object", () => {
    expect(parser.parseObject({ asset: { type: "bar" } })).toMatchSnapshot();
  });

  it("applicability", () => {
    new ApplicabilityPlugin().applyParser(parser);
    new MultiNodePlugin().applyParser(parser);

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
  });

  it("multi-node", () => {
    new MultiNodePlugin().applyParser(parser);

    expect(
      parser.parseObject({
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
          ],
        },
      }),
    ).toMatchSnapshot();
  });

  it("template", () => {
    const model: DataModelWithParser = withParser(
      new LocalModel(),
      parseBinding,
    );
    const expressionEvaluator: ExpressionEvaluator = new ExpressionEvaluator({
      model,
    });
    const options: Options = {
      evaluate: expressionEvaluator.evaluate,
      schema: new SchemaController(),
      data: {
        format: (binding, val) => val,
        formatValue: (val) => val,
        model,
      },
    };
    new TemplatePlugin(options).applyParser(parser);

    const petNames = ["Ginger", "Daisy", "Afra"];
    model.set([["foo.bar", petNames]]);

    expect(
      parser.parseObject({
        asset: {
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
        },
      }),
    ).toMatchSnapshot();
  });

  it("switch", () => {
    new SwitchPlugin({
      evaluate: () => {
        return true;
      },
    } as any).applyParser(parser);

    expect(
      parser.parseObject({
        id: "toughView",
        type: "view",
        title: {
          staticSwitch: [
            {
              case: "'true'",
              asset: {
                id: "test",
                type: "text",
                value: "test-text.",
              },
            },
          ],
        },
      }),
    ).toMatchSnapshot();
  });
});
