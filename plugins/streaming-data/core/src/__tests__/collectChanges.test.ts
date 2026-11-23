import { describe, it, expect } from "vitest";
import { collectChanges } from "../collectChanges";
import type { ChangeContext } from "../collectChanges";
import { RecordCollection } from "../RecordCollection";
import type { CommitRecordsRequest } from "../types";

interface Item {
  id: string;
  name: string;
  note?: string;
}

const collection = new RecordCollection<Item>(
  "items",
  "itemsStatus",
  ({ id }) => id,
);
collection.append([
  { id: "a", name: "A" },
  { id: "b", name: "B", note: "keep" },
]);

/** A data model held in a map, where `{{row.name}} = 'x'` sets the row's name and `fail()` throws */
const contextOf = (data: Record<string, unknown>) => {
  const model = new Map(Object.entries(data));
  const context: ChangeContext = {
    get: (binding) => model.get(binding),
    set: (binding, value) => {
      model.set(binding, value);
    },
    delete: (binding) => {
      model.delete(binding);
    },
    evaluate: (expression) => {
      if (expression === "fail()") throw new Error("Broken");
      const [, field, value] =
        /^\{\{row\.(\w+)\}\} = '(\w*)'$/.exec(expression) ?? [];
      if (field)
        model.set("row", { ...(model.get("row") as object), [field]: value });
    },
  };
  return { model, context };
};

const request = (
  change: Partial<CommitRecordsRequest>,
): CommitRecordsRequest => ({ binding: "items", eachRow: [], ...change });

describe("collectChanges", () => {
  it("runs eachRow on a copy of each held record, keeps what changed, and clears the row", () => {
    const { model, context } = contextOf({ selected: ["a", "b", "z", 3] });

    const changes = collectChanges(
      collection,
      request({
        update: "selected",
        rowBinding: "row",
        eachRow: ["{{row.name}} = 'A'", "{{row.note}} = 'new'"],
      }),
      context,
    );

    expect(changes.update).toEqual([
      {
        key: "a",
        patch: { note: "new" },
        record: { id: "a", name: "A", note: "new" },
      },
      {
        key: "b",
        patch: { name: "A", note: "new" },
        record: { id: "b", name: "A", note: "new" },
      },
    ]);
    expect(collection.get("a")).toEqual({ id: "a", name: "A" });
    expect(model.has("row")).toBe(false);
  });

  it("clears the row when an eachRow expression throws", () => {
    const { model, context } = contextOf({ selected: ["a", "b"] });

    expect(() =>
      collectChanges(
        collection,
        request({
          update: "selected",
          rowBinding: "row",
          eachRow: ["{{row.name}} = 'x'", "fail()"],
        }),
        context,
      ),
    ).toThrow("Broken");
    expect(model.has("row")).toBe(false);
  });

  it("creates a draft without a key, and saves the changed fields of one with a key", () => {
    const created = collectChanges(
      collection,
      request({ save: "draft" }),
      contextOf({ draft: { id: "", name: "New" } }).context,
    );
    expect(created).toEqual({
      create: [{ id: "", name: "New" }],
      update: [],
      remove: [],
    });

    const updated = collectChanges(
      collection,
      request({ save: "draft" }),
      contextOf({ draft: { id: "b", name: "B2" } }).context,
    );
    expect(updated.update).toEqual([
      {
        key: "b",
        patch: { name: "B2", note: null },
        record: { id: "b", name: "B2", note: null },
      },
    ]);
  });

  it("ignores a draft that isn't an object or whose key isn't held", () => {
    const { context } = contextOf({ draft: { id: "z", name: "Z" }, list: [] });

    expect(
      collectChanges(collection, request({ save: "draft" }), context),
    ).toEqual({
      create: [],
      update: [],
      remove: [],
    });
    expect(
      collectChanges(collection, request({ save: "list" }), context).create,
    ).toEqual([]);
  });

  it("removes the held records among one key or a list of them, each with its key", () => {
    expect(
      collectChanges(
        collection,
        request({ remove: "key" }),
        contextOf({ key: "a" }).context,
      ).remove,
    ).toEqual([{ key: "a", record: { id: "a", name: "A" } }]);

    const removed = collectChanges(
      collection,
      request({ remove: "keys" }),
      contextOf({ keys: ["b", "z", ""] }).context,
    ).remove;
    expect(removed).toEqual([
      { key: "b", record: { id: "b", name: "B", note: "keep" } },
    ]);
    expect(removed[0]?.record).toBe(collection.get("b"));
  });
});
