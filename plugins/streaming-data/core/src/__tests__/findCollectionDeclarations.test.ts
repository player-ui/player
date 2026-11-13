import { describe, it, expect } from "vitest";
import type { Schema } from "@player-ui/player";
import { findCollectionDeclarations } from "../findCollectionDeclarations";

const asSchema = (schema: unknown) => schema as Schema.Schema;

describe("findCollectionDeclarations", () => {
  it("finds nothing without a schema or its ROOT", () => {
    const none = { declarations: [], problems: [] };
    expect(findCollectionDeclarations(undefined)).toEqual(none);
    expect(findCollectionDeclarations(asSchema({ ItemType: {} }))).toEqual(
      none,
    );
  });

  it("walks nested types from ROOT, but not into arrays, records, or a type it is already inside", () => {
    const transactions = {
      ref: "transactions",
      status: "ledger.transactionsStatus",
      params: { accountId: "{{accountId}}" },
    };
    const schema = asSchema({
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
        again: { type: "LedgerType" },
      },
      NestedType: {
        hidden: {
          type: "TransactionType",
          isArray: true,
          source: { ref: "transactions" },
        },
      },
    });

    expect(findCollectionDeclarations(schema)).toEqual({
      declarations: [{ binding: "ledger.transactions", source: transactions }],
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
    const schema = asSchema({
      ROOT: {
        transactions: { type: "TransactionType", isArray: true, source },
      },
    });
    expect(findCollectionDeclarations(schema)).toEqual({
      declarations: [],
      problems: [{ binding: "transactions", problem }],
    });
  });
});
