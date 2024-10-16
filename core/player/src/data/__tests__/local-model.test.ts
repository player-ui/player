import { it, expect } from "vitest";
import { BindingParser } from "../../binding";
import { LocalModel } from "..";

const parser = new BindingParser({
  get: () => undefined,
  set: () => undefined,
  evaluate: () => undefined,
});
const binding = parser.parse("foo.bar");
it("sets data", () => {
  const model = new LocalModel();
  model.set([[binding, "baz"]]);
  expect(model.get(binding)).toBe("baz");
});

it("overrides data", () => {
  const model = new LocalModel({ foo: { bar: "baz" } });
  expect(model.get(binding)).toBe("baz");
  model.set([[binding, "not baz"]]);
  expect(model.get(binding)).toBe("not baz");
});

it("gets data", () => {
  const model = new LocalModel({ foo: { bar: "baz" } });
  expect(model.get(binding)).toBe("baz");
});

it("resets data", () => {
  const model = new LocalModel({ foo: { bar: "baz" } });
  expect(model.get(binding)).toBe("baz");
  model.reset();
  expect(model.get(binding)).toBe(undefined);
});

it("resets data starting with new model", () => {
  const model = new LocalModel({ foo: { bar: "baz" } });
  expect(model.get(binding)).toBe("baz");
  model.reset({ foo: { bar: "not baz" } });
  expect(model.get(binding)).toBe("not baz");
});

it("retuns the whole model when no binding is passed", () => {
  const model = new LocalModel({ foo: { bar: "baz" } });
  expect(model.get()).toStrictEqual({ foo: { bar: "baz" } });
});
