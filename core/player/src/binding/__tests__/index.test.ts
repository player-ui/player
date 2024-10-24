import { describe, test, expect, vitest } from "vitest";
import { BindingParser } from "..";

test("caches bindings", () => {
  const parser = new BindingParser();
  const b1 = parser.parse("foo.bar");
  const b2 = parser.parse("foo.bar");
  const b3 = parser.parse(["foo", "bar"]);

  expect(b1).toBe(b2);
  expect(b1).toBe(b3);
});

test("does not call the update hook when readOnly is true", () => {
  const onSetHook = vitest.fn();
  const onGetHook = vitest.fn();

  const parser = new BindingParser({
    get: (b) => {
      onGetHook(b);
      return [{ bar: "blah" }];
    },
    set: onSetHook,
    readOnly: true,
  });

  parser.parse('foo[bar="baz"].blah');
  expect(onGetHook).toBeCalledWith(parser.parse("foo"));
  expect(onSetHook).not.toHaveBeenCalled();
});

test("calls the update hook when data needs to be changed", () => {
  const onSetHook = vitest.fn();
  const onGetHook = vitest.fn();

  const parser = new BindingParser({
    get: (b) => {
      onGetHook(b);

      return [{ bar: "blah" }];
    },
    set: onSetHook,
  });

  parser.parse('foo[bar="baz"].blah');
  expect(onGetHook).toBeCalledWith(parser.parse("foo"));
  expect(onSetHook).toBeCalledWith([[parser.parse("foo.1.bar"), "baz"]]);
});

test("skips the update hook when data does not need to be changed", () => {
  const onSetHook = vitest.fn();
  const onGetHook = vitest.fn();

  const parser = new BindingParser({
    get: (b) => {
      onGetHook(b);

      return [{ bar: "baz" }];
    },
    set: onSetHook,
  });

  parser.parse('foo[bar="baz"].blah');
  expect(onGetHook).toBeCalledWith(parser.parse("foo"));
  expect(onSetHook).not.toBeCalledWith(parser.parse("foo"));
});

test("throws error on bad binding syntax", () => {
  const parser = new BindingParser();
  expect(() => parser.parse("foo.bar[")).toThrowError(
    /Cannot normalize path "foo.bar\[/,
  );
});

test("works for binding with nested refs", () => {
  let callCount = 0;

  const parser = new BindingParser({
    get: () => {
      return callCount++;
    },
  });

  expect(parser.parse("foo.{{bar}}.baz").asString()).toBe("foo.0.baz");
  expect(parser.parse("foo.{{bar}}.baz").asString()).toBe("foo.1.baz");
});

test("works for bindings with nested boolean refs", () => {
  const parser = new BindingParser({
    get: () => {
      return true;
    },
  });

  expect(parser.parse("foo.{{bar}}.baz").asString()).toBe("foo.true.baz");
});

test("works for binding with partial-nested refs", () => {
  const parser = new BindingParser({
    get: (binding) => {
      if (binding.asString() === "hello") {
        return "bar";
      }

      return "not-{{hello}}";
    },
  });

  expect(parser.parse("foo.{{hello}}_world.baz").asString()).toBe(
    "foo.bar_world.baz",
  );
  expect(parser.parse("foo.{{hello}}_other_{{world}}.baz").asString()).toBe(
    "foo.bar_other_not-bar.baz",
  );
});

test("works for expanded nested refs", () => {
  const parser = new BindingParser({
    get: (binding) => {
      if (binding.asString() === "nested") {
        return "nested.ref[1]";
      }
    },
  });

  expect(parser.parse("foo.{{nested}}.baz").asString()).toBe(
    "foo.nested.ref.1.baz",
  );
});

test("returns a binding if its already parsed", () => {
  const parser = new BindingParser();
  const binding = parser.parse("foo.bar");
  expect(parser.parse(binding)).toBe(binding);
});

test("top level parser returns empty key set", () => {
  const parser = new BindingParser();
  const binding = parser.parse("");
  expect(binding.asArray()).toHaveLength(0);
  expect(binding.asString()).toBe("");
});

describe("errors", () => {
  test("throws when it gets an undefined nested path", () => {
    const parser = new BindingParser({
      get: () => undefined,
    });

    expect(() => parser.parse("foo.{{nested}}.bar")).toThrowError();
  });

  test("throws when get is used but not wired up", () => {
    const parser = new BindingParser({
      get: () => undefined,
    });

    expect(() =>
      parser.parse("foo.{{nested}}.bar"),
    ).toThrowErrorMatchingInlineSnapshot(
      `[NestedError: Cannot resolve binding: foo.{{nested}}.bar]`,
    );
  });

  test("works for bindings with escaped numeric bindings", () => {
    const parser = new BindingParser({
      get: () => {
        return true;
      },
    });

    expect(parser.parse("foo['01'].baz").asString()).toBe("foo.01.baz");
    expect(parser.parse("foo.01.baz").asString()).toBe("foo.1.baz");
  });

  test("throws when set is used but not wired up", () => {
    const parser = new BindingParser({
      get: () => [],
    });

    expect(() => parser.parse("foo[foo=bar].bar")).toThrowError();
  });

  test("throws when eval is used but not wired up", () => {
    const parser = new BindingParser();

    expect(() => parser.parse("foo.`exp()`.bar")).toThrowError();
  });

  test("throws when a path is not binding serializable", () => {
    const parser = new BindingParser({
      get: () => ({
        foo: "bar",
      }),
    });

    expect(() => parser.parse("foo.{{nested}}.bar")).toThrowError();
  });

  // When exp() === '' -> ??? (foo.bar) | Error

  describe("expressions", () => {
    test("throws when expression returns undef", () => {
      const parser = new BindingParser({
        evaluate: () => undefined,
      });

      expect(() => parser.parse("foo.`exp()`.bar")).toThrowError();
    });

    test("throws when expression returns empty binding", () => {
      const parser = new BindingParser({
        evaluate: () => "",
      });

      expect(() => parser.parse("foo.`exp()`.bar")).toThrowError();
    });
  });
});
