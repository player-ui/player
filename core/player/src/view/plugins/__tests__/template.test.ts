import { describe, it, expect, beforeEach } from "vitest";
import { BindingParser } from "../../../binding";
import type { DataModelWithParser } from "../../../data";
import { LocalModel, withParser } from "../../../data";
import { ExpressionEvaluator } from "../../../expressions";
import { SchemaController } from "../../../schema";
import { NodeType } from "../../parser";
import { Parser } from "../../parser";
import { ViewInstance } from "../../view";
import type { Options } from "../options";
import TemplatePlugin from "../template-plugin";
import { StringResolverPlugin, toNodeResolveOptions } from "../..";

const templateJoinValues = {
  id: "snippet-of-json",
  topic: "Snippet",
  schema: {},
  data: {
    forms: {
      "1099-A": [
        {
          description: "Desciption of concept 1099 1",
          amount: "Help",
        },
      ],
      "1099-B": [
        {
          description: "Desciption of concept 1099 2",
          amount: "Help",
        },
      ],
    },
  },
  views: [
    {
      id: "overviewGroup",
      type: "overviewGroup",
      metaData: {
        role: "stateful",
      },
      modifiers: [
        {
          type: "tag",
          value: "fancy-header",
        },
      ],
      headers: {
        label: {
          asset: {
            id: "line-of-work-summary-gh-header-label",
            type: "text",
            value: "Header",
          },
        },
        values: [
          {
            asset: {
              id: "line-of-work-summary-gh-expenses-simple-header-previous-year",
              type: "text",
              value: "Type",
            },
          },
          {
            asset: {
              id: "line-of-work-summary-gh-expenses-simple-header-cy",
              type: "text",
              value: "2022",
            },
          },
        ],
      },
      template: [
        {
          data: "forms.1099-A",
          output: "values",
          value: {
            asset: {
              id: "overviewItem3",
              type: "overviewItem",
              label: {
                asset: {
                  id: "overviewItem3-label",
                  type: "text",
                  value: "1099-A",
                },
              },
              values: [
                {
                  asset: {
                    id: "overviewItem3-year",
                    type: "text",
                    value: "Desciption of concept 1099 1",
                  },
                },
                {
                  asset: {
                    id: "loverviewItem3-cy",
                    type: "text",
                    value: "4000",
                  },
                },
              ],
            },
          },
        },
        {
          data: "forms.1099-B",
          output: "values",
          value: {
            asset: {
              id: "overviewItem4",
              type: "overviewItem",
              label: {
                asset: {
                  id: "overviewItem4-label",
                  type: "text",
                  value: "1099-B",
                },
              },
              values: [
                {
                  asset: {
                    id: "overviewItem4-year",
                    type: "text",
                    value: "Desciption of concept 1099 2",
                  },
                },
                {
                  asset: {
                    id: "loverviewItem3-cy",
                    type: "text",
                    value: "6000",
                  },
                },
              ],
            },
          },
        },
      ],
      values: [
        {
          asset: {
            id: "overviewItem1",
            type: "overviewItem",
            label: {
              asset: {
                id: "overviewItem1-label",
                type: "text",
                value: "First Summary",
              },
            },
            values: [
              {
                asset: {
                  id: "overviewItem1-year",
                  type: "text",
                  value: "Desciption of year summary 1",
                },
              },
              {
                asset: {
                  id: "loverviewItem1-cy",
                  type: "text",
                  value: "14000",
                },
              },
            ],
          },
        },
        {
          asset: {
            id: "overviewItem2",
            type: "overviewItem",
            label: {
              asset: {
                id: "overviewItem2-label",
                type: "text",
                value: "Second year Summary",
              },
            },
            values: [
              {
                asset: {
                  id: "overviewItem2-year",
                  type: "text",
                  value: "Desciption of year summary item 2",
                },
              },
              {
                asset: {
                  id: "loverviewItem1-cy",
                  type: "text",
                  value: "19000",
                },
              },
            ],
          },
        },
      ],
    },
    {
      id: "overviewGroup",
      type: "overviewGroup",
      metaData: {
        role: "stateful",
      },
      modifiers: [
        {
          type: "tag",
          value: "fancy-header",
        },
      ],
      headers: {
        label: {
          asset: {
            id: "line-of-work-summary-gh-header-label",
            type: "text",
            value: "Header",
          },
        },
        values: [
          {
            asset: {
              id: "line-of-work-summary-gh-expenses-simple-header-previous-year",
              type: "text",
              value: "Type",
            },
          },
          {
            asset: {
              id: "line-of-work-summary-gh-expenses-simple-header-cy",
              type: "text",
              value: "2022",
            },
          },
        ],
      },
      values: [
        {
          asset: {
            id: "overviewItem1",
            type: "overviewItem",
            label: {
              asset: {
                id: "overviewItem1-label",
                type: "text",
                value: "First Summary",
              },
            },
            values: [
              {
                asset: {
                  id: "overviewItem1-year",
                  type: "text",
                  value: "Desciption of year summary 1",
                },
              },
              {
                asset: {
                  id: "loverviewItem1-cy",
                  type: "text",
                  value: "14000",
                },
              },
            ],
          },
        },
        {
          asset: {
            id: "overviewItem2",
            type: "overviewItem",
            label: {
              asset: {
                id: "overviewItem2-label",
                type: "text",
                value: "Second year Summary",
              },
            },
            values: [
              {
                asset: {
                  id: "overviewItem2-year",
                  type: "text",
                  value: "Desciption of year summary item 2",
                },
              },
              {
                asset: {
                  id: "loverviewItem1-cy",
                  type: "text",
                  value: "19000",
                },
              },
            ],
          },
        },
      ],
      template: [
        {
          data: "forms.1099-A",
          output: "values",
          value: {
            asset: {
              id: "overviewItem3",
              type: "overviewItem",
              label: {
                asset: {
                  id: "overviewItem3-label",
                  type: "text",
                  value: "1099-A",
                },
              },
              values: [
                {
                  asset: {
                    id: "overviewItem3-year",
                    type: "text",
                    value: "Desciption of concept 1099 1",
                  },
                },
                {
                  asset: {
                    id: "loverviewItem3-cy",
                    type: "text",
                    value: "4000",
                  },
                },
              ],
            },
          },
        },
        {
          data: "forms.1099-B",
          output: "values",
          value: {
            asset: {
              id: "overviewItem4",
              type: "overviewItem",
              label: {
                asset: {
                  id: "overviewItem4-label",
                  type: "text",
                  value: "1099-B",
                },
              },
              values: [
                {
                  asset: {
                    id: "overviewItem4-year",
                    type: "text",
                    value: "Desciption of concept 1099 2",
                  },
                },
                {
                  asset: {
                    id: "loverviewItem3-cy",
                    type: "text",
                    value: "6000",
                  },
                },
              ],
            },
          },
        },
      ],
    },
  ],
  navigation: {
    BEGIN: "SnippetFlow",
    SnippetFlow: {
      startState: "VIEW_Snippet-View1",
      "VIEW_Snippet-View1": {
        ref: "overviewGroup",
        state_type: "VIEW",
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

  it("determines if nodeType is template", () => {
    const nodeTest = "template";
    const nodeType = parser.hooks.determineNodeType.call(nodeTest);
    expect(nodeType).toStrictEqual("template");
  });

  it("Does not return a nodeType", () => {
    const nodeTest = {
      value: "foo",
    };
    const nodeType = parser.hooks.determineNodeType.call(nodeTest);
    expect(nodeType).toBe(undefined);
  });

  it("returns templateNode if template exists", () => {
    const obj = {
      dynamic: true,
      data: "foo.bar",
      output: "values",
      value: {
        value: "{{foo.bar._index_}}",
      },
    };
    const nodeOptions = {
      templateDepth: 1,
    };
    const parsedNode = parser.hooks.parseNode.call(
      obj,
      NodeType.Value,
      nodeOptions,
      NodeType.Template,
    );
    expect(parsedNode).toStrictEqual({
      data: "foo.bar",
      depth: 1,
      dynamic: true,
      template: {
        value: "{{foo.bar._index_}}",
      },
      type: "template",
    });
  });

  it("returns templateNode if template exists, and templateDepth is not set", () => {
    const obj = {
      data: "foo.bar2",
      output: "values",
      dynamic: true,
      value: {
        value: "{{foo.bar2._index_}}",
      },
    };
    const nodeOptions = {};
    const parsedNode = parser.hooks.parseNode.call(
      obj,
      NodeType.Value,
      nodeOptions,
      NodeType.Template,
    );
    expect(parsedNode).toStrictEqual({
      data: "foo.bar2",
      depth: 0,
      dynamic: true,
      template: {
        value: "{{foo.bar2._index_}}",
      },
      type: "template",
    });
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
      const view = new ViewInstance(templateJoinValues.views[0], {
        model,
        parseBinding,
        evaluator,
        schema: new SchemaController(),
      });

      const pluginOptions = toNodeResolveOptions(view.resolverOptions);
      new TemplatePlugin(pluginOptions).apply(view);
      new StringResolverPlugin().apply(view);

      const resolved = view.update();

      expect(resolved.values).toHaveLength(4);
      expect(resolved.values[0]).toMatchSnapshot();
    });
    it("Should show template item last when coming after values on lexical order", () => {
      const view = new ViewInstance(templateJoinValues.views[1], {
        model,
        parseBinding,
        evaluator,
        schema: new SchemaController(),
      });

      const pluginOptions = toNodeResolveOptions(view.resolverOptions);
      new TemplatePlugin(pluginOptions).apply(view);
      new StringResolverPlugin().apply(view);

      const resolved = view.update();

      expect(resolved.values).toHaveLength(4);
      expect(resolved.values[0]).toMatchSnapshot();
    });
  });
});
