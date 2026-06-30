import { test, expect } from "vitest";
import { ContextStore } from "../store";
import { defineContextKey } from "../key";

test("set / get / has literal", () => {
  const store = new ContextStore();
  const key = defineContextKey<number>("count", "A count");

  expect(store.has(key)).toBe(false);
  store.set(key, 42);
  expect(store.has(key)).toBe(true);
  expect(store.get(key)).toBe(42);

  const descriptors = store.list();
  expect(descriptors).toHaveLength(1);
  expect(descriptors[0]).toMatchObject({
    description: "A count",
    hasValue: true,
    hasTransform: false,
  });
});

test("transform aggregates from sources on get", () => {
  const store = new ContextStore();
  const a = defineContextKey<number>("a", "A");
  const b = defineContextKey<number>("b", "B");
  const sum = defineContextKey<number>("sum", "A + B");

  store.set(a, 2);
  store.set(b, 3);
  store.registerTransform(sum, {
    sources: [a, b],
    compute: (read) => (read(a) ?? 0) + (read(b) ?? 0),
  });

  expect(store.get(sum)).toBe(5);
  expect(store.has(sum)).toBe(true);
});

test("literal overrides transform on get", () => {
  const store = new ContextStore();
  const a = defineContextKey<number>("a", "A");
  const target = defineContextKey<number>("t", "T");

  store.set(a, 10);
  store.registerTransform(target, {
    sources: [a],
    compute: (read) => (read(a) ?? 0) * 2,
  });
  expect(store.get(target)).toBe(20);

  store.set(target, 99);
  expect(store.get(target)).toBe(99);
});

test("dependentsOf tracks reverse index from transform sources", () => {
  const store = new ContextStore();
  const src = defineContextKey<number>("src", "src");
  const t1 = defineContextKey<number>("t1", "t1");
  const t2 = defineContextKey<number>("t2", "t2");

  store.registerTransform(t1, { sources: [src], compute: () => 1 });
  store.registerTransform(t2, { sources: [src], compute: () => 2 });

  const deps = store.dependentsOf(src.symbol);
  const depSymbols = new Set(deps.map((k) => k.symbol));
  expect(depSymbols.has(t1.symbol)).toBe(true);
  expect(depSymbols.has(t2.symbol)).toBe(true);
  expect(deps).toHaveLength(2);
});

test("re-registering a transform updates the reverse index", () => {
  const store = new ContextStore();
  const oldSrc = defineContextKey<number>("old", "old");
  const newSrc = defineContextKey<number>("new", "new");
  const target = defineContextKey<number>("target", "target");

  store.registerTransform(target, { sources: [oldSrc], compute: () => 1 });
  store.registerTransform(target, { sources: [newSrc], compute: () => 2 });

  expect(store.dependentsOf(oldSrc.symbol)).toHaveLength(0);
  expect(store.dependentsOf(newSrc.symbol)).toHaveLength(1);
});

test("freeze captures literal and transform-computed values, deep-freezes the snapshot", () => {
  const store = new ContextStore();
  const a = defineContextKey<number>("a", "A");
  const doubled = defineContextKey<number>("doubled", "A doubled");

  store.set(a, 7);
  store.registerTransform(doubled, {
    sources: [a],
    compute: (read) => (read(a) ?? 0) * 2,
  });

  const snapshot = store.freeze({ endedAt: 1000 });
  expect(snapshot.endedAt).toBe(1000);
  expect(snapshot.entries).toHaveLength(2);
  const byDesc = Object.fromEntries(
    snapshot.entries.map((e) => [e.description, e.value]),
  );
  expect(byDesc).toEqual({ A: 7, "A doubled": 14 });

  expect(Object.isFrozen(snapshot)).toBe(true);
  expect(Object.isFrozen(snapshot.entries)).toBe(true);
  expect(Object.isFrozen(snapshot.entries[0])).toBe(true);
});
