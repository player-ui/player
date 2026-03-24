import { test, expect } from "vitest";
import { createObjectMatcher } from "../deep-partial-matcher";

test("works on basic objects", () => {
  const matcher = createObjectMatcher({ foo: "bar" });
  expect(matcher({})).toBe(false);
  expect(matcher({ foo: "bar" })).toBe(true);
  expect(matcher({ foo: "bar", bar: "baz" })).toBe(true);
});

test("handles null values correctly", () => {
  // Test matching on null value
  const matcherWithNull = createObjectMatcher({ foo: null });
  expect(matcherWithNull({ foo: null })).toBe(true);
  expect(matcherWithNull({ foo: "bar" })).toBe(false);
  expect(matcherWithNull({})).toBe(false);

  // Test matching on combination of null and non-null values
  const matcherMixed = createObjectMatcher({ foo: null, bar: "baz" });
  expect(matcherMixed({ foo: null, bar: "baz" })).toBe(true);
  expect(matcherMixed({ foo: null, bar: "other" })).toBe(false);
  expect(matcherMixed({ foo: "something", bar: "baz" })).toBe(false);
});

test("handles undefined values correctly", () => {
  // Test matching on undefined value
  // Note: dlv treats missing properties the same as undefined, so { foo: undefined } matches {}
  const matcherWithUndefined = createObjectMatcher({ foo: undefined });
  expect(matcherWithUndefined({ foo: undefined })).toBe(true);
  expect(matcherWithUndefined({})).toBe(true); // Missing property is treated as undefined
  expect(matcherWithUndefined({ foo: "bar" })).toBe(false);
  expect(matcherWithUndefined({ foo: null })).toBe(false);
});
