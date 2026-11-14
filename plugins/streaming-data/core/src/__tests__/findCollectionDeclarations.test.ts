import { describe, it, expect } from "vitest";
import { SchemaController } from "@player-ui/player";
import type { Schema } from "@player-ui/player";
import { findCollectionDeclarations } from "../findCollectionDeclarations";

const parse = (schema: unknown) =>
  new SchemaController(schema as Schema.Schema).schema;

describe("findCollectionDeclarations", () => {
  it("finds nothing in a schema without declarations", () => {
    const none = { declarations: [], problems: [] };
    expect(findCollectionDeclarations(new Map())).toEqual(none);
    expect(
      findCollectionDeclarations(
        parse({ ROOT: { name: { type: "StringType" } } }),
      ),
    ).toEqual(none);
  });

  it("finds declarations in nested types, and reports one inside an array or record", () => {
    const transactions = {
      ref: "transactions",
      status: "ledger.transactionsStatus",
      params: { accountId: "{{accountId}}" },
    };
    const parsed = parse({
      ROOT: {
        ledger: { type: "LedgerType" },
        list: { type: "NestedType", isArray: true },
        map: { type: "NestedType", isRecord: true },
        name: { type: "StringType" },
      },
      LedgerType: {
        transactions: {
          type: "TransactionType",
          isArray: true,
          source: transactions,
        },
      },
      NestedType: {
        hidden: {
          type: "TransactionType",
          isArray: true,
          source: { ref: "transactions" },
        },
      },
    });

    const problem = "a collection can't sit inside an array or record";
    expect(findCollectionDeclarations(parsed)).toEqual({
      declarations: [{ binding: "ledger.transactions", source: transactions }],
      problems: [
        { binding: "list.[].hidden", problem },
        { binding: "map.{}.hidden", problem },
      ],
    });
  });

  it("reads a schema with entries that aren't data types", () => {
    const transactions = { ref: "transactions" };
    const parsed = parse({
      ROOT: {
        kind: "array",
        other: { type: "OtherType" },
        ledger: { type: "LedgerType" },
      },
      OtherType: { type: "array", items: "StringType" },
      LedgerType: {
        transactions: {
          type: "TransactionType",
          isArray: true,
          source: transactions,
        },
      },
    });

    expect(findCollectionDeclarations(parsed)).toEqual({
      declarations: [{ binding: "ledger.transactions", source: transactions }],
      problems: [],
    });
  });

  it("skips parsed entries that are not objects", () => {
    const parsed = new Map<string, unknown>([
      ["empty", null],
      ["kind", "array"],
      ["count", 1],
      ["list", [{ source: { ref: "transactions" } }]],
    ]);
    expect(findCollectionDeclarations(parsed)).toEqual({
      declarations: [],
      problems: [],
    });
  });

  it.each([
    ["is not an object", "transactions", "`source` must be an object"],
    ["is a list", ["transactions"], "`source` must be an object"],
    ["has no ref", {}, "`ref` must name a source"],
    ["has an empty ref", { ref: "" }, "`ref` must name a source"],
    [
      "has a status that is not text",
      { ref: "transactions", status: 1 },
      "`status` must be a binding",
    ],
    [
      "has an empty status",
      { ref: "transactions", status: "" },
      "`status` must be a binding",
    ],
    [
      "has params that are not an object",
      { ref: "transactions", params: ["accountId"] },
      "`params` must be an object",
    ],
  ])("reports a source that %s", (_, source, problem) => {
    const parsed = parse({
      ROOT: {
        transactions: { type: "TransactionType", isArray: true, source },
      },
    });
    expect(findCollectionDeclarations(parsed)).toEqual({
      declarations: [],
      problems: [{ binding: "transactions", problem }],
    });
  });
});
