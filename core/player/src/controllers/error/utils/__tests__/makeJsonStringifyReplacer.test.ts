import { describe, it, expect } from "vitest";
import { makeJsonStringifyReplacer } from "../makeJsonStringifyReplacer";

describe("makeJsonStringifyReplacer", () => {
  it("should return [CIRCULAR] when the same object is used as the value multiple times", () => {
    const val = {
      prop: "value",
    };
    const fn = makeJsonStringifyReplacer();

    expect(fn("", val)).toStrictEqual({
      prop: "value",
    });

    expect(fn("", val)).toBe("[CIRCULAR]");
  });

  it("should return the value when it is not an object or is null", () => {
    const fn = makeJsonStringifyReplacer();

    expect(fn("", null)).toBeNull();
    expect(fn("", "test")).toBe("test");
  });
});
