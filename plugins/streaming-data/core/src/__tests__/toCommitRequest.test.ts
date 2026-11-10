import { describe, it, expect } from "vitest";
import { toCommitRequest } from "../toCommitRequest";

describe("toCommitRequest", () => {
  it("reads a bulk update, with eachRow from beside param", () => {
    expect(
      toCommitRequest({
        param: {
          binding: "transactions",
          update: "table.selectedKeys",
          rowBinding: "row",
        },
        eachRow: ["{{row.category}} = 'travel'", "{{row.reviewed}} = true"],
      }),
    ).toEqual({
      binding: "transactions",
      update: "table.selectedKeys",
      rowBinding: "row",
      eachRow: ["{{row.category}} = 'travel'", "{{row.reviewed}} = true"],
      save: undefined,
      remove: undefined,
    });
  });

  it("takes one eachRow expression, or none for a save or a removal", () => {
    expect(
      toCommitRequest({
        param: { binding: "transactions", update: "keys", rowBinding: "row" },
        eachRow: "{{row.category}} = 'travel'",
      }),
    ).toMatchObject({ eachRow: ["{{row.category}} = 'travel'"] });
    expect(
      toCommitRequest({
        param: { binding: "transactions", save: "draft", remove: "key" },
      }),
    ).toEqual({
      binding: "transactions",
      eachRow: [],
      save: "draft",
      remove: "key",
      update: undefined,
      rowBinding: undefined,
    });
  });

  it.each([
    ["param is missing", {}, "`param` must be an object"],
    ["param is a list", { param: [] }, "`param` must be an object"],
    [
      "eachRow is inside param, where Player would resolve its templates",
      { param: { binding: "transactions", eachRow: ["{{row.a}} = 1"] } },
      "`eachRow` goes on the state beside `param`, where Player leaves it as written",
    ],
    [
      "binding is missing",
      { param: { save: "draft" } },
      "`param.binding` must name a collection",
    ],
    [
      "binding is empty",
      { param: { binding: "" } },
      "`param.binding` must name a collection",
    ],
    [
      "rowBinding is not a binding",
      { param: { binding: "transactions", update: "keys", rowBinding: 3 } },
      "`param.update` and `param.rowBinding` must be bindings",
    ],
    [
      "save is empty",
      { param: { binding: "transactions", save: "" } },
      "`param.save` and `param.remove` must be bindings",
    ],
    [
      "eachRow holds something other than expressions",
      {
        param: { binding: "transactions", update: "keys", rowBinding: "row" },
        eachRow: [1],
      },
      "`eachRow` must be an expression or a list of them",
    ],
    [
      "update has no rowBinding",
      {
        param: { binding: "transactions", update: "keys" },
        eachRow: ["{{row.a}} = 1"],
      },
      "`param.update` needs `param.rowBinding` and `eachRow`",
    ],
    [
      "update has no eachRow",
      { param: { binding: "transactions", update: "keys", rowBinding: "row" } },
      "`param.update` needs `param.rowBinding` and `eachRow`",
    ],
  ])("says why it is no request when %s", (_case, state, problem) => {
    expect(toCommitRequest(state)).toEqual({ problem });
  });
});
