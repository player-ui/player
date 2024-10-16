import { test, expect, vitest } from "vitest";
import {
  trimSlashes,
  removeEmptyValuesFromObject,
  callOrReturn,
} from "../helpers";

test("trims all the slashes from start and end", () => {
  expect(trimSlashes("/test/")).toBe("test");
  expect(trimSlashes("/test")).toBe("test");
  expect(trimSlashes("test/")).toBe("test");
  expect(trimSlashes("//test//")).toBe("test");
  expect(trimSlashes("/te/st/")).toBe("te/st");
});

test("removes all nullable key:values from object", () => {
  expect(
    removeEmptyValuesFromObject({
      a: true,
      b: false,
      c: undefined,
      d: null,
      e: 0,
    }),
  ).toMatchInlineSnapshot(`
    {
      "a": true,
      "b": false,
      "e": 0,
    }
  `);
});

test("calls arg1 when instance of function with arg2 value", () => {
  const fn = vitest.fn();
  callOrReturn(fn, ["abc"]);
  expect(fn).toHaveBeenCalledWith(["abc"]);
  expect(callOrReturn("123", ["abc"])).toBe("123");
});
