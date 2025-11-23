import { test, expect } from "vitest";
import { createObjectMatcher } from "../deep-partial-matcher";

test("works on basic objects", () => {
  const matcher = createObjectMatcher({ foo: "bar" });
  expect(matcher({})).toBe(false);
  expect(matcher({ foo: "bar" })).toBe(true);
  expect(matcher({ foo: "bar", bar: "baz" })).toBe(true);
});
