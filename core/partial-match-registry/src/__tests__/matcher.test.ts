import { test, expect } from "vitest";
import createObjectMatch from "../deep-partial-matcher";

test("works on basic objects", () => {
  const matcher = createObjectMatch({ foo: "bar" });
  expect(matcher({})).toBe(false);
  expect(matcher({ foo: "bar" })).toBe(true);
  expect(matcher({ foo: "bar", bar: "baz" })).toBe(true);
});
