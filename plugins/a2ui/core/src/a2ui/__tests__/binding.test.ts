import { describe, expect, test } from "vitest";
import {
  bindingToSegments,
  interpolatePointers,
  pointerToBinding,
} from "../binding";

describe("pointerToBinding", () => {
  test("converts simple absolute pointer to dot notation", () => {
    expect(pointerToBinding("/user/firstName")).toBe("user.firstName");
  });

  test("converts pointer with numeric segments to array indexing", () => {
    expect(pointerToBinding("/items/0/name")).toBe("items[0].name");
  });

  test("handles deeply nested numeric segments", () => {
    expect(pointerToBinding("/a/b/0/c/12/d")).toBe("a.b[0].c[12].d");
  });

  test("root pointer returns empty string", () => {
    expect(pointerToBinding("/")).toBe("");
    expect(pointerToBinding("")).toBe("");
  });

  test("preserves relative pointer (no leading slash)", () => {
    expect(pointerToBinding("firstName")).toBe("firstName");
    expect(pointerToBinding("a/b/c")).toBe("a.b.c");
  });

  test("decodes RFC 6901 escapes", () => {
    expect(pointerToBinding("/foo~1bar/baz~0qux")).toBe("foo/bar.baz~qux");
  });

  test("numeric leading segment becomes array indexing", () => {
    expect(pointerToBinding("/0/name")).toBe("[0].name");
  });
});

describe("interpolatePointers", () => {
  test("replaces a single absolute path interpolation", () => {
    expect(interpolatePointers("Hello, ${/user/name}!")).toBe(
      "Hello, {{user.name}}!",
    );
  });

  test("replaces multiple interpolations", () => {
    expect(interpolatePointers("${/a}/${/b}/${/c}")).toBe("{{a}}/{{b}}/{{c}}");
  });

  test("handles relative paths inside interpolation", () => {
    expect(interpolatePointers("Item ${name}")).toBe("Item {{name}}");
  });

  test("leaves strings without ${} untouched", () => {
    expect(interpolatePointers("plain text")).toBe("plain text");
  });
});

describe("bindingToSegments", () => {
  test("splits dotted path into name segments", () => {
    expect(bindingToSegments("user.address.zip")).toEqual([
      "user",
      "address",
      "zip",
    ]);
  });

  test("preserves array indices as bracketed segments", () => {
    expect(bindingToSegments("items[0].name")).toEqual([
      "items",
      "[0]",
      "name",
    ]);
  });

  test("handles consecutive array indices", () => {
    expect(bindingToSegments("matrix[0][1].cell")).toEqual([
      "matrix",
      "[0]",
      "[1]",
      "cell",
    ]);
  });

  test("empty binding returns empty array", () => {
    expect(bindingToSegments("")).toEqual([]);
  });
});
