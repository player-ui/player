import { test, expect } from "vitest";
import { defineContextKey, resolveContextKeySymbol } from "../key";

test("two keys with the same name share Symbol.for identity", () => {
  const a = defineContextKey<string>("form-state", "Current form state");
  const b = defineContextKey<string>("form-state", "Different description");

  expect(a.symbol).toBe(b.symbol);
  expect(a.description).toBe("Current form state");
  expect(b.description).toBe("Different description");
});

test("resolveContextKeySymbol matches defineContextKey identity", () => {
  const key = defineContextKey("simulation", "Simulator context");
  expect(resolveContextKeySymbol("simulation")).toBe(key.symbol);
});

test("distinct names produce distinct symbols", () => {
  const a = defineContextKey("alpha", "A");
  const b = defineContextKey("beta", "B");
  expect(a.symbol).not.toBe(b.symbol);
});
