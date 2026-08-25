import { test, expect } from "vitest";
import { ContextHistory } from "../history";
import type { FrozenContextSnapshot } from "../types";

const snap = (endedAt: number): FrozenContextSnapshot =>
  Object.freeze({
    endedAt,
    entries: Object.freeze([]),
  });

test("push appends in order", () => {
  const h = new ContextHistory();
  h.push(snap(1));
  h.push(snap(2));
  h.push(snap(3));

  expect(h.size()).toBe(3);
  expect(h.entries().map((s) => s.endedAt)).toEqual([1, 2, 3]);
});

test("clear empties the stack", () => {
  const h = new ContextHistory();
  h.push(snap(1));
  h.clear();
  expect(h.size()).toBe(0);
  expect(h.entries()).toEqual([]);
});
