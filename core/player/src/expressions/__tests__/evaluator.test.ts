import { describe, it, expect, vitest, test, beforeEach } from "vitest";
import type { DataModelWithParser } from "../../data";
import { LocalModel, withParser } from "../../data";
import type { BindingLike } from "../../binding";
import { BindingParser } from "../../binding";
import type { ExpressionType } from "..";
import { ExpressionEvaluator } from "..";

describe("evaluator", () => {
  let evaluator: ExpressionEvaluator;
  let model: DataModelWithParser;
  let parseBinding: BindingParser["parse"];

  beforeEach(() => {
    const localModel = new LocalModel();
    const bindingParser = new BindingParser({
      get: localModel.get,
      set: localModel.set,
      evaluate: (exp: ExpressionType) => {
        return evaluator.evaluate(exp);
      },
    });

    parseBinding = bindingParser.parse;
    model = withParser(localModel, bindingParser.parse);
    evaluator = new ExpressionEvaluator({ model });
  });

  test("resolveOptions hook", () => {
    model = withParser(new LocalModel({ foo: 2 }), parseBinding);
    evaluator = new ExpressionEvaluator({ model });

    const testFn = vitest.fn();

    evaluator.hooks.resolveOptions.tap("test", (hookOptions) => {
      testFn.mockImplementation((value: any) => hookOptions.model.set(value));

      return { ...hookOptions, model: { ...hookOptions.model, set: testFn } };
    });

    evaluator.evaluate("{{foo}} = 3");
    expect(model.get("foo")).toStrictEqual(3);
    expect(testFn).toBeCalled();
  });

  test("member expression", () => {
    evaluator.setExpressionVariable("foo", { bar: "baz" });
    expect(evaluator.evaluate('foo["bar"]')).toStrictEqual("baz");
  });
  test("custom variables (identifier)", () => {
    evaluator.setExpressionVariable("foo", 3);
    evaluator.setExpressionVariable("bar", "baz");
    evaluator.setExpressionVariable("bang", [1, 2, 3]);
    expect(evaluator.evaluate("foo")).toStrictEqual(3);
    expect(evaluator.evaluate("foo + 1")).toStrictEqual(4);
    expect(evaluator.evaluate("bar")).toStrictEqual("baz");
    expect(evaluator.evaluate("bang")).toStrictEqual([1, 2, 3]);
  });
  test("literals", () => {
    expect(evaluator.evaluate("2")).toStrictEqual(2);
    expect(evaluator.evaluate("true")).toStrictEqual(true);
    expect(evaluator.evaluate("false")).toStrictEqual(false);
    expect(evaluator.evaluate("undefined")).toBe(undefined);
    expect(evaluator.evaluate(undefined)).toBe(undefined);
    expect(evaluator.evaluate(null)).toBe(null);
    expect(evaluator.evaluate("null")).toBe(null);

    expect(evaluator.evaluate(2)).toStrictEqual(2);
    expect(evaluator.evaluate(true)).toStrictEqual(true);
    expect(evaluator.evaluate(false)).toStrictEqual(false);
  });

  test("Objects", () => {
    expect(
      evaluator.evaluate('[{"foo": "value"}, {"bar": "value"}]'),
    ).toStrictEqual([
      {
        foo: "value",
      },
      { bar: "value" },
    ]);
    expect(evaluator.evaluate('{"foo": "value"}')).toStrictEqual({
      foo: "value",
    });
    expect(evaluator.evaluate('{"foo": 1 + 2}')).toStrictEqual({
      foo: 3,
    });
    expect(evaluator.evaluate('{"foo": 1 > 2}')).toStrictEqual({
      foo: false,
    });
    expect(evaluator.evaluate('{"foo": 1 + 2, "bar": 4}')).toStrictEqual({
      foo: 3,
      bar: 4,
    });
    expect(
      evaluator.evaluate('{"foo": 2, "bar": { "baz":  "foo" }}'),
    ).toStrictEqual({
      foo: 2,
      bar: {
        baz: "foo",
      },
    });

    expect(evaluator.evaluate({ value: "1 + 2" })).toStrictEqual(3);
  });
  test("functions", () => {
    model = withParser(new LocalModel({ test: 2 }), parseBinding);
    evaluator.addExpressionFunction("publish", (_context, key, value: any) => {
      model.set([[key as BindingLike, value]]);
    });
    evaluator.evaluate('publish("test", {"key": "value"})');
    expect(model.get("test")).toStrictEqual({ key: "value" });
  });

  test("eval in context", () => {
    model = withParser(new LocalModel({ test: 2 }), parseBinding);
    evaluator.addExpressionFunction("exec", (_context, value: string) => {
      _context.evaluate(value);
    });
    evaluator.evaluate('exec("{{foo}} = true")', { model });
    expect(model.get("foo")).toBe(true);
  });

  test("binary operators", () => {
    expect(evaluator.evaluate("1 == 1")).toStrictEqual(true);
    expect(evaluator.evaluate("1 == 2")).toStrictEqual(false);

    expect(evaluator.evaluate("1 === 1")).toStrictEqual(true);
    expect(evaluator.evaluate("1 === 2")).toStrictEqual(false);

    expect(evaluator.evaluate("1 != 1")).toStrictEqual(false);
    expect(evaluator.evaluate("1 != 2")).toStrictEqual(true);

    expect(evaluator.evaluate("1 !== 1")).toStrictEqual(false);
    expect(evaluator.evaluate("1 !== 2")).toStrictEqual(true);

    expect(evaluator.evaluate("1 < 2")).toStrictEqual(true);
    expect(evaluator.evaluate("1 < 1")).toStrictEqual(false);
    expect(evaluator.evaluate("1 < 0")).toStrictEqual(false);
    expect(evaluator.evaluate("2 > 1")).toStrictEqual(true);
    expect(evaluator.evaluate("1 > 1")).toStrictEqual(false);
    expect(evaluator.evaluate("0 > 1")).toStrictEqual(false);

    expect(evaluator.evaluate("1 <= 2")).toStrictEqual(true);
    expect(evaluator.evaluate("1 <= 1")).toStrictEqual(true);
    expect(evaluator.evaluate("1 <= 0")).toStrictEqual(false);
    expect(evaluator.evaluate("2 >= 1")).toStrictEqual(true);
    expect(evaluator.evaluate("1 >= 1")).toStrictEqual(true);
    expect(evaluator.evaluate("0 >= 1")).toStrictEqual(false);

    expect(evaluator.evaluate("1 + 2")).toStrictEqual(3);
    expect(evaluator.evaluate("5 - 3")).toStrictEqual(2);
    expect(evaluator.evaluate("2 * 3")).toStrictEqual(6);
    expect(evaluator.evaluate("6 / 3")).toStrictEqual(2);
    expect(evaluator.evaluate("8 % 3")).toStrictEqual(2);
  });

  test("add binary operators", () => {
    evaluator.addBinaryOperator("==", () => 5);

    expect(evaluator.evaluate("1 == 2")).toStrictEqual(5);
  });
  test("add unary operators", () => {
    evaluator.addUnaryOperator("!", () => 5);

    expect(evaluator.evaluate("!1")).toStrictEqual(5);
  });

  test("logical operators", () => {
    expect(evaluator.evaluate("true && false")).toStrictEqual(false);
    expect(evaluator.evaluate("true && true")).toStrictEqual(true);
    expect(evaluator.evaluate("1 && 2")).toStrictEqual(2);
    expect(evaluator.evaluate("1 && 0")).toStrictEqual(0);
  });

  test("unary operators", () => {
    expect(evaluator.evaluate("!false")).toStrictEqual(true);
    expect(evaluator.evaluate("!true")).toStrictEqual(false);
    expect(evaluator.evaluate("+1")).toStrictEqual(1);
    expect(evaluator.evaluate("-1")).toStrictEqual(-1);
    expect(evaluator.evaluate("-(-1)")).toStrictEqual(1);
  });

  test("model ref", () => {
    model = withParser(new LocalModel({ foo: { bar: "baz" } }), parseBinding);
    expect(
      evaluator.evaluate("{{foo.bar}}", {
        model,
      }),
    ).toStrictEqual("baz");
  });

  test("model ref and Object", () => {
    model = withParser(
      new LocalModel({ bar: { hello: "world" } }),
      parseBinding,
    );
    expect(
      evaluator.evaluate('{ "foo": {{bar}} }', {
        model,
      }),
    ).toStrictEqual({ foo: { hello: "world" } });
  });

  test("ternary operator (conditional)", () => {
    expect(evaluator.evaluate("true ? true : false")).toStrictEqual(true);
    expect(evaluator.evaluate("false ? true : false")).toStrictEqual(false);
  });

  test("array", () => {
    expect(evaluator.evaluate("[1,2,3]")).toStrictEqual([1, 2, 3]);
  });

  test("assignment", () => {
    model = withParser(new LocalModel({ foo: 2 }), parseBinding);
    evaluator.evaluate("{{foo}} = 3", {
      model,
    });
    expect(model.get("foo")).toStrictEqual(3);
  });

  test("local assignment and re-assignment", () => {
    evaluator.evaluate("foo = 5");
    expect(evaluator.evaluate("foo")).toStrictEqual(5);
    evaluator.evaluate("foo = 7");
    expect(evaluator.evaluate("foo")).toStrictEqual(7);
  });

  test("object assignment", () => {
    model = withParser(new LocalModel({ foo: 2 }), parseBinding);
    evaluator.evaluate('{{foo}} = {"foo": 2}', {
      model,
    });

    expect(model.get("foo")).toStrictEqual({ foo: 2 });
  });
  describe("modification", () => {
    describe("on model", () => {
      beforeEach(() => {
        model = withParser(new LocalModel({ foo: 1 }), parseBinding);
      });

      test("simple add", () => {
        evaluator.evaluate("{{foo}} += 3", { model });
        expect(model.get("foo")).toStrictEqual(4);
      });

      test("simple substract", () => {
        evaluator.evaluate("{{foo}} -= 3", { model });
        expect(model.get("foo")).toStrictEqual(-2);
      });
    });

    describe("on expression variable", () => {
      beforeEach(() => {
        evaluator.setExpressionVariable("foo", 1);
      });

      test("simple add", () => {
        evaluator.evaluate("foo += 3");
        expect(evaluator.getExpressionVariable("foo")).toStrictEqual(4);
      });

      test("simple subtract", () => {
        evaluator.evaluate("foo -= 3");
        expect(evaluator.getExpressionVariable("foo")).toStrictEqual(-2);
      });
    });
  });

  describe("Call Expressions", () => {
    beforeEach(() => {
      model = withParser(new LocalModel({ foo: 1 }), parseBinding);
    });

    test("get model", () => {
      expect(
        evaluator.evaluate('getDataVal("foo")', {
          model,
        }),
      ).toStrictEqual(1);
    });
    test("set model", () => {
      evaluator.evaluate('setDataVal("foo", 2)', {
        model,
      });
      expect(model.get("foo")).toStrictEqual(2);
    });
    test("conditional", () => {
      expect(
        evaluator.evaluate("conditional(true, true, false)"),
      ).toStrictEqual(true);

      expect(
        evaluator.evaluate("conditional(false, true, false)"),
      ).toStrictEqual(false);
    });
  });
  describe("not supported", () => {
    test("this ref", () => {
      expect(() => evaluator.evaluate("this")).toThrow();
    });

    test("compound expression", () => {
      expect(() => evaluator.evaluate("foo bar")).toThrow();
    });
  });

  describe("error handling", () => {
    test("skips throwing error when handler is provided, but not when throwErrors is true", () => {
      const errorHandler = vitest.fn();

      evaluator.hooks.onError.tap("test", (e) => {
        errorHandler(e);

        return true;
      });

      evaluator.evaluate("foo()");

      expect(errorHandler).toBeCalledTimes(1);

      expect(() =>
        evaluator.evaluate("foo()", { throwErrors: true, model }),
      ).toThrowError();
    });
  });

  describe("complex", () => {
    beforeEach(() => {
      model = withParser(
        new LocalModel({ foo: { bar: true }, baz: { other: false } }),
        parseBinding,
      );
    });

    it("can set a model to an object", () => {
      evaluator.evaluate("{{foo.nested}} = false || {{baz}}", { model });
      expect(model.get("foo.nested.other")).toStrictEqual(false);
    });
  });

  describe("shortcuts binary ops", () => {
    const aFunc = vitest.fn();
    const bFunc = vitest.fn();

    beforeEach(() => {
      aFunc.mockReset();
      bFunc.mockReset();

      evaluator.addExpressionFunction("a", aFunc);
      evaluator.addExpressionFunction("b", bFunc);
    });

    it("shortcuts || on true", () => {
      aFunc.mockReturnValue(true);
      evaluator.evaluate("a() || b()");

      expect(aFunc).toBeCalledTimes(1);
      expect(bFunc).not.toBeCalled();
    });

    it("works for full ||", () => {
      aFunc.mockReturnValue(0);
      evaluator.evaluate("a() || b()");

      expect(aFunc).toBeCalledTimes(1);
      expect(bFunc).toBeCalledTimes(1);
    });

    it("shortcuts && on false", () => {
      aFunc.mockReturnValue(0);
      evaluator.evaluate("a() && b()");

      expect(aFunc).toBeCalledTimes(1);
      expect(bFunc).not.toBeCalled();
    });

    it("works for full &&", () => {
      aFunc.mockReturnValue(true);
      evaluator.evaluate("a() && b()");

      expect(aFunc).toBeCalledTimes(1);
      expect(bFunc).toBeCalledTimes(1);
    });
  });

  test("throws errors for unknown expressions", () => {
    expect(() => evaluator.evaluate("foo()")).toThrowError(
      "Error evaluating expression: foo()",
    );
  });

  test("enables hooks to change expression", () => {
    evaluator.hooks.beforeEvaluate.tap("test", (expression) => {
      return `'foo' == 'bar'`;
    });

    expect(evaluator.evaluate("bar()")).toStrictEqual(false);
  });

  test("ignores props other than value on expression", () => {
    expect(
      evaluator.evaluate({
        _comment: "hello world",
        value: true,
      } as any),
    ).toStrictEqual(true);
  });
});
