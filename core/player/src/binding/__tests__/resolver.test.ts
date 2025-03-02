import { describe, test, expect, vitest } from "vitest";
import get from "dlv";
import type { ParserSuccessResult } from "../../binding-grammar";
import { parseCustom } from "../../binding-grammar";
import { resolveBindingAST } from "../resolver";
import { getBindingSegments } from "../utils";

export const testModel = {
  foo: {
    pets: [
      {
        name: "ginger",
        type: "dog",
      },
      {
        name: "daisy",
        type: "dog",
      },
      {
        name: "frodo",
        type: "cat",
      },
      "other",
    ],
  },
} as const;

export const testCases: Array<[string, string]> = [
  ["foo.bar", "foo.bar"],
  ["foo.pets.1.name", "foo.pets.1.name"],
  ["foo.pets.01.name", "foo.pets.1.name"],
  ["foo.pets['01'].name", "foo.pets.01.name"],
  ["foo.pets[01].name", "foo.pets.1.name"],
  ['foo.pets[name = "frodo"].type', "foo.pets.2.type"],
  ['foo.pets["name" = "sprinkles"].type', "foo.pets.4.type"],
];

test.each(testCases)("Resolving binding: %s", (binding, expectedResolved) => {
  const parsedBinding = parseCustom(binding);
  expect(parsedBinding.status).toBe(true);
  const actual = resolveBindingAST(
    (parsedBinding as ParserSuccessResult).path,
    {
      getValue: (path) => get(testModel, getBindingSegments(path) as any),
      convertToPath: (p) => p,
      evaluate: () => undefined,
    },
  );

  expect(actual.path.join(".")).toBe(expectedResolved);
});

test("works for nested keys", () => {
  const parsedBinding = parseCustom("foo.{{BASE_PATH}}.bar");
  expect(parsedBinding.status).toBe(true);

  const resolved = resolveBindingAST(
    (parsedBinding as ParserSuccessResult).path,
    {
      getValue: () => "path.nested[1]",
      convertToPath: () => "path.nested.1",
      evaluate: () => undefined,
    },
  );
  expect(resolved.path.join(".")).toBe("foo.path.nested.1.bar");
  expect(resolved.path).toStrictEqual(["foo", "path", "nested", 1, "bar"]);
});

describe("expressions", () => {
  test("evaluates expressions as paths", () => {
    const parsedBinding = parseCustom("foo.bar.`exp()`");

    const evaluate = vitest.fn().mockReturnValue(100);
    const resolved = resolveBindingAST(
      (parsedBinding as ParserSuccessResult).path,
      {
        getValue: () => undefined,
        convertToPath: (p) => p,
        evaluate,
      },
    );

    expect(evaluate).toBeCalledWith("exp()");
    expect(resolved.path.join(".")).toBe("foo.bar.100");
  });
});
