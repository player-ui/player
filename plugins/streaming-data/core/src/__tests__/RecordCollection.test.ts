import { describe, it, expect } from "vitest";
import { RecordCollection } from "../RecordCollection";
import type { CollectionChange } from "../types";

interface Item {
  id: string;
  name: string;
}

const item = (id: string, name = id.toUpperCase()): Item => ({ id, name });

const collectionOf = (...items: Item[]) => {
  const collection = new RecordCollection<Item>(
    "items",
    "itemsStatus",
    ({ id }) => id,
  );
  const changes: Array<CollectionChange<Item>> = [];
  collection.append(items);
  collection.subscribe((change) => changes.push(change));
  return { collection, changes };
};

describe("RecordCollection", () => {
  it("appends to the same list, freezes each record, and indexes it by key", () => {
    const { collection, changes } = collectionOf(item("a"));
    const list = collection.records;

    expect(collection.append([item("b"), item("c")])).toEqual({
      updatedIndexes: [],
      appended: 2,
      removed: 0,
    });
    expect(collection.records).toBe(list);
    expect(collection.records.map(({ id }) => id)).toEqual(["a", "b", "c"]);
    expect(Object.isFrozen(collection.get("c"))).toBe(true);
    expect(collection.indexOf("b")).toBe(1);
    expect(collection.indexOf("z")).toBe(-1);
    expect(changes).toEqual([
      { type: "appended", records: [item("b"), item("c")] },
    ]);
  });

  it("replaces records by key in place and reports where they are", () => {
    const { collection, changes } = collectionOf(
      item("a"),
      item("b"),
      item("c"),
    );
    const list = collection.records;

    expect(collection.merge([item("c", "C2"), item("d")], [])).toEqual({
      updatedIndexes: [2],
      appended: 1,
      removed: 0,
    });
    expect(collection.records).toBe(list);
    expect(collection.get("c")?.name).toBe("C2");
    expect(changes.map(({ type }) => type)).toEqual(["updated", "appended"]);
  });

  it("drops removed keys into a new list and re-indexes the rest", () => {
    const { collection, changes } = collectionOf(
      item("a"),
      item("b"),
      item("c"),
    );
    const list = collection.records;

    expect(collection.merge([], ["a", "missing"])).toEqual({
      updatedIndexes: [],
      appended: 0,
      removed: 1,
    });
    expect(collection.records).not.toBe(list);
    expect(collection.indexOf("c")).toBe(1);
    expect(changes).toEqual([{ type: "removed", keys: ["a"] }]);
  });

  it("appends a batch too large to spread into one push", () => {
    const { collection } = collectionOf();
    const many = Array.from({ length: 25_000 }, (_, index) =>
      item(`k${index}`),
    );

    collection.append(many);

    expect(collection.records).toHaveLength(25_000);
    expect(collection.indexOf("k24999")).toBe(24_999);
  });

  it("announces a reset, and a merged save, to subscribers until they stop listening", () => {
    const { collection, changes } = collectionOf(item("a"));
    const stop = collection.subscribe(() => undefined);

    collection.committed("partial");
    collection.clear();
    stop();

    expect(changes).toEqual([
      { type: "committed", outcome: "partial" },
      { type: "reset" },
    ]);
    expect(collection.records).toEqual([]);
    expect(collection.indexOf("a")).toBe(-1);
  });
});
