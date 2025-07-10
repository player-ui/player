import { describe, test, expect, beforeEach, vitest } from "vitest";
import type { DataModelWithParser } from "../../data";
import { LocalModel, withParser } from "../../data";
import { BindingParser } from "../../binding";
import {
  deleteDataVal,
  setDataVal,
  getDataVal,
  waitFor,
} from "../evaluator-functions";
import type { ExpressionContext } from "../types";
import { isAwaitable, isPromiseLike } from "../async";

describe("eval functions", () => {
  let model: DataModelWithParser;
  let context: ExpressionContext;

  beforeEach(() => {
    const localModel = new LocalModel();
    const bindingParser = new BindingParser({
      get: localModel.get,
      set: localModel.set,
      evaluate: () => undefined,
    });
    model = withParser(localModel, bindingParser.parse);
    context = {
      model,
      evaluate: () => undefined,
    };
  });

  test("deleteDataVal", () => {
    model.set([["foo.bar", 2]]);
    expect(model.get("foo.bar")).toBe(2);

    deleteDataVal(context, "foo.bar");
    expect(model.get("foo.bar")).toBeUndefined();
  });

  test("setDataVal", () => {
    model.set([["foo.bar", 2]]);
    expect(model.get("foo.bar")).toBe(2);

    setDataVal(context, "foo.bar", 10);
    expect(model.get("foo.bar")).toBe(10);
  });

  test("getDataVal", () => {
    model.set([["foo.bar", 2]]);
    expect(model.get("foo.bar")).toBe(2);
    expect(getDataVal(context, "foo.bar")).toBe(2);
  });

  test("waitFor/await", async () => {
    const testFn = vitest.fn()
    const testPromise = new Promise((resolve) => {
      setTimeout(() => {
        testFn()
        resolve("foo");
      }, 100);
    });

    const test = waitFor({} as ExpressionContext, testPromise);
    expect(isPromiseLike(test) && isAwaitable(test)).toBe(true);
    /** TS shows this unneeded because waitFor doesn't technically look like a promise */
    const result = await test
    expect(testFn).toBeCalled()
    expect(result).toBe('foo')
  });
});
