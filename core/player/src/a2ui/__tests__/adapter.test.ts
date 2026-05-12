import { describe, expect, test } from "vitest";
import { adaptA2UIToFlow } from "../adapter";
import type { A2UISnapshot } from "../types";
import { A2UI_EVENT_CONTEXT_NAMESPACE } from "../types";

const snapshot = (
  components: A2UISnapshot["components"],
  extras: Partial<A2UISnapshot> = {},
): A2UISnapshot => ({
  surfaceId: "main",
  components,
  ...extras,
});

describe("adaptA2UIToFlow — minimal cases", () => {
  test("single Text root", () => {
    const flow = adaptA2UIToFlow(
      snapshot([
        {
          id: "root",
          component: "Text",
          text: "Hello, World!",
        },
      ]),
    );

    expect(flow.id).toBe("main");
    expect(flow.views).toHaveLength(1);
    expect(flow.views?.[0]).toMatchObject({
      id: "main",
      type: "Text",
      text: "Hello, World!",
    });
    expect(flow.navigation.BEGIN).toBe("FLOW_1");
    expect(flow.data).toEqual({});
    expect(flow.schema).toBeUndefined();
  });

  test("uses dataModel as initial data when present", () => {
    const flow = adaptA2UIToFlow(
      snapshot([{ id: "root", component: "Text", text: "x" }], {
        dataModel: { message: "Hello" },
      }),
    );
    expect(flow.data).toEqual({ message: "Hello" });
  });
});

describe("adaptA2UIToFlow — child inlining", () => {
  test("`child` reference gets inlined under {asset: ...}", () => {
    const flow = adaptA2UIToFlow(
      snapshot([
        { id: "root", component: "Card", child: "title" },
        { id: "title", component: "Text", text: "Hi" },
      ]),
    );
    expect(flow.views?.[0]).toMatchObject({
      id: "main",
      type: "Card",
      child: { asset: { id: "title", type: "Text", text: "Hi" } },
    });
  });

  test("`children: [...]` becomes an array of asset wrappers", () => {
    const flow = adaptA2UIToFlow(
      snapshot([
        { id: "root", component: "Column", children: ["a", "b"] },
        { id: "a", component: "Text", text: "first" },
        { id: "b", component: "Text", text: "second" },
      ]),
    );
    expect(flow.views?.[0]).toMatchObject({
      type: "Column",
      children: [
        { asset: { id: "a", type: "Text", text: "first" } },
        { asset: { id: "b", type: "Text", text: "second" } },
      ],
    });
  });

  test("templated children become a Player template", () => {
    const flow = adaptA2UIToFlow(
      snapshot([
        {
          id: "root",
          component: "List",
          children: { path: "/employees", componentId: "emp_card" },
        },
        { id: "emp_card", component: "Card", child: "emp_name" },
        {
          id: "emp_name",
          component: "Text",
          text: { path: "firstName" },
        },
      ]),
    );

    const view = flow.views?.[0] as Record<string, unknown>;
    expect(view.type).toBe("List");
    expect(view.template).toEqual([
      {
        data: "employees",
        output: "children",
        value: {
          asset: {
            id: "emp_card-_index_",
            type: "Card",
            child: {
              asset: {
                id: "emp_name",
                type: "Text",
                text: "employees._index_.firstName",
              },
            },
          },
        },
      },
    ]);
  });

  test("missing root throws", () => {
    expect(() =>
      adaptA2UIToFlow(snapshot([{ id: "x", component: "Text", text: "y" }])),
    ).toThrow(/must contain a component with id 'root'/);
  });

  test("cycle detection throws", () => {
    expect(() =>
      adaptA2UIToFlow(
        snapshot([
          { id: "root", component: "Card", child: "a" },
          { id: "a", component: "Card", child: "root" },
        ]),
      ),
    ).toThrow(/cycle detected/);
  });

  test("unknown child reference throws", () => {
    expect(() =>
      adaptA2UIToFlow(
        snapshot([{ id: "root", component: "Card", child: "missing" }]),
      ),
    ).toThrow(/could not be resolved/);
  });
});

describe("adaptA2UIToFlow — dynamic values", () => {
  test("{path} becomes a bare binding string", () => {
    const flow = adaptA2UIToFlow(
      snapshot([
        {
          id: "root",
          component: "Text",
          text: { path: "/message" },
        },
      ]),
    );
    expect(flow.views?.[0]).toMatchObject({ text: "message" });
  });

  test("formatString becomes a template literal with {{}} interpolations", () => {
    const flow = adaptA2UIToFlow(
      snapshot([
        {
          id: "root",
          component: "Text",
          text: {
            call: "formatString",
            args: {
              value: "Hello, ${/user/firstName} from ${/appName}!",
            },
          },
        },
      ]),
    );
    expect(flow.views?.[0]).toMatchObject({
      text: "Hello, {{user.firstName}} from {{appName}}!",
    });
  });

  test("other function calls become Player expressions", () => {
    const flow = adaptA2UIToFlow(
      snapshot([
        {
          id: "root",
          component: "Text",
          text: {
            call: "formatNumber",
            args: { value: { path: "/price" } },
          },
        },
      ]),
    );
    expect(flow.views?.[0]).toMatchObject({
      text: "@[formatNumber(price)]@",
    });
  });
});

describe("adaptA2UIToFlow — actions", () => {
  test("functionCall action becomes an expression with no transition", () => {
    const flow = adaptA2UIToFlow(
      snapshot([
        {
          id: "root",
          component: "Button",
          text: "Open",
          action: {
            functionCall: {
              call: "openUrl",
              args: { url: { path: "/url" } },
            },
          },
        },
      ]),
    );
    const view = flow.views?.[0] as Record<string, unknown>;
    expect(view.value).toBeUndefined();
    expect(view.exp).toBe("@[openUrl(url)]@");
    expect(flow.navigation.FLOW_1).toMatchObject({
      VIEW_1: { transitions: { "*": "END_Done" } },
    });
  });

  test("event action becomes a transition value plus per-event END state", () => {
    const flow = adaptA2UIToFlow(
      snapshot([
        {
          id: "root",
          component: "Column",
          children: ["submit", "cancel"],
        },
        {
          id: "submit",
          component: "Button",
          text: "Submit",
          action: {
            event: {
              name: "submit_form",
              context: { itemId: "123", user: { path: "/user/id" } },
            },
          },
        },
        {
          id: "cancel",
          component: "Button",
          text: "Cancel",
          action: { event: { name: "cancel" } },
        },
      ]),
    );

    const view = flow.views?.[0] as { children: Array<{ asset: any }> };
    const submitAsset = view.children[0].asset;
    expect(submitAsset.value).toBe("submit_form");
    expect(submitAsset.exp).toEqual([
      `{{${A2UI_EVENT_CONTEXT_NAMESPACE}.itemId}} = "123"`,
      `{{${A2UI_EVENT_CONTEXT_NAMESPACE}.user}} = {{user.id}}`,
    ]);

    const cancelAsset = view.children[1].asset;
    expect(cancelAsset.value).toBe("cancel");
    expect(cancelAsset.exp).toBeUndefined();

    const navFlow = flow.navigation.FLOW_1 as Record<string, any>;
    expect(navFlow.VIEW_1.transitions).toMatchObject({
      submit_form: "END_submit_form",
      cancel: "END_cancel",
      "*": "END_Done",
    });
    expect(navFlow.END_submit_form).toEqual({
      state_type: "END",
      outcome: "submit_form",
    });
    expect(navFlow.END_cancel).toEqual({
      state_type: "END",
      outcome: "cancel",
    });
  });
});
