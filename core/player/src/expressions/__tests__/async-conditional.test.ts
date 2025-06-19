import { describe, test, expect, beforeEach } from "vitest";
import { ExpressionEvaluator } from "../evaluator";
import { LocalModel, withParser } from "../../data";
import { BindingParser } from "../../binding";

describe("async conditional expressions", () => {
  let evaluator: ExpressionEvaluator;
  let model: any;

  beforeEach(() => {
    const bindingParser = new BindingParser();
    model = withParser(
      new LocalModel({}),
      bindingParser.parse.bind(bindingParser),
    );
    evaluator = new ExpressionEvaluator({ model });
  });

  test("conditional with sync values works normally", () => {
    expect(evaluator.evaluate("true ? 'yes' : 'no'")).toBe("yes");
    expect(evaluator.evaluate("false ? 'yes' : 'no'")).toBe("no");
  });

  test("conditional with async test condition returns Promise and resolves correctly", async () => {
    // Add an async function that returns false
    evaluator.addExpressionFunction("asyncFalse", async () => {
      return Promise.resolve(false);
    });

    // Add an async function that returns true
    evaluator.addExpressionFunction("asyncTrue", async () => {
      return Promise.resolve(true);
    });

    // Test with async false condition - should return Promise
    const falseResult = evaluator.evaluate("asyncFalse() ? 'yes' : 'no'");
    expect(falseResult).toBeInstanceOf(Promise);
    expect(await falseResult).toBe("no");

    // Test with async true condition - should return Promise
    const trueResult = evaluator.evaluate("asyncTrue() ? 'yes' : 'no'");
    expect(trueResult).toBeInstanceOf(Promise);
    expect(await trueResult).toBe("yes");
  });

  test("conditional with async test condition and async branches", async () => {
    evaluator.addExpressionFunction("asyncTrue", async () => {
      return Promise.resolve(true);
    });

    evaluator.addExpressionFunction("asyncValue", async (ctx, val) => {
      return Promise.resolve(val);
    });

    const result = evaluator.evaluate(
      "asyncTrue() ? asyncValue('truthy') : asyncValue('falsy')",
    );
    expect(result).toBeInstanceOf(Promise);
    expect(await result).toBe("truthy");
  });

  test("logical operators with async values", async () => {
    evaluator.addExpressionFunction("asyncTrue", async () => {
      return Promise.resolve(true);
    });

    evaluator.addExpressionFunction("asyncFalse", async () => {
      return Promise.resolve(false);
    });

    // Test && with async left side (false)
    const andFalseResult = evaluator.evaluate("asyncFalse() && true");
    expect(andFalseResult).toBeInstanceOf(Promise);
    expect(await andFalseResult).toBe(false);

    // Test && with async left side (true)
    const andTrueResult = evaluator.evaluate("asyncTrue() && 'right-side'");
    expect(andTrueResult).toBeInstanceOf(Promise);
    expect(await andTrueResult).toBe("right-side");

    // Test || with async left side (true)
    const orTrueResult = evaluator.evaluate(
      "asyncTrue() || 'should-not-evaluate'",
    );
    expect(orTrueResult).toBeInstanceOf(Promise);
    expect(await orTrueResult).toBe(true);

    // Test || with async left side (false)
    const orFalseResult = evaluator.evaluate("asyncFalse() || 'right-side'");
    expect(orFalseResult).toBeInstanceOf(Promise);
    expect(await orFalseResult).toBe("right-side");
  });

  test("nested conditional with async test", async () => {
    evaluator.addExpressionFunction("asyncTrue", async () => {
      return Promise.resolve(true);
    });

    evaluator.addExpressionFunction("asyncFalse", async () => {
      return Promise.resolve(false);
    });

    const result = evaluator.evaluate(
      "asyncTrue() ? (asyncFalse() ? 'inner-true' : 'inner-false') : 'outer-false'",
    );
    expect(result).toBeInstanceOf(Promise);
    expect(await result).toBe("inner-false");
  });

  test("Complex async expression with conditionals and logical operators", async () => {
    evaluator.addExpressionFunction(
      "delayedValue",
      async (ctx, value, delay = 1) => {
        return new Promise((resolve) => {
          setTimeout(() => resolve(value), Number(delay));
        });
      },
    );

    const result = evaluator.evaluate(
      "delayedValue(false, 1) && delayedValue(true, 1) ? delayedValue('should-not-reach', 1) : delayedValue('correct', 1)",
    );

    expect(result).toBeInstanceOf(Promise);
    expect(await result).toBe("correct");
  });

  test("Unary not operator with async values", async () => {
    evaluator.addExpressionFunction("asyncTrue", async () => {
      return Promise.resolve(true);
    });

    evaluator.addExpressionFunction("asyncFalse", async () => {
      return Promise.resolve(false);
    });

    // Test !async
    const notTrueResult = evaluator.evaluate("!asyncTrue()");
    expect(notTrueResult).toBeInstanceOf(Promise);
    expect(await notTrueResult).toBe(false);

    const notFalseResult = evaluator.evaluate("!asyncFalse()");
    expect(notFalseResult).toBeInstanceOf(Promise);
    expect(await notFalseResult).toBe(true);
  });

  test("Binary comparison operators with async values", async () => {
    evaluator.addExpressionFunction("asyncValue", async (ctx, val) => {
      return Promise.resolve(val);
    });

    // Test equality
    const eqResult = evaluator.evaluate("asyncValue(5) == 5");
    expect(eqResult).toBeInstanceOf(Promise);
    expect(await eqResult).toBe(true);

    // Test strict equality
    const strictEqResult = evaluator.evaluate("asyncValue(5) === 5");
    expect(strictEqResult).toBeInstanceOf(Promise);
    expect(await strictEqResult).toBe(true);

    // Test greater than
    const gtResult = evaluator.evaluate("asyncValue(10) > 5");
    expect(gtResult).toBeInstanceOf(Promise);
    expect(await gtResult).toBe(true);

    // Test less than
    const ltResult = evaluator.evaluate("asyncValue(3) < 5");
    expect(ltResult).toBeInstanceOf(Promise);
    expect(await ltResult).toBe(true);
  });

  test("Array expressions with mixed sync/async values", async () => {
    evaluator.addExpressionFunction("asyncValue", async (ctx, val) => {
      return Promise.resolve(val);
    });

    const result = evaluator.evaluate("[1, asyncValue(2), 3, asyncValue(4)]");
    expect(result).toBeInstanceOf(Promise);
    expect(await result).toEqual([1, 2, 3, 4]);
  });

  test("Object expressions with async keys/values", async () => {
    evaluator.addExpressionFunction("asyncValue", async (ctx, val) => {
      return Promise.resolve(val);
    });

    const result = evaluator.evaluate('{"sync": 1, "async": asyncValue(2)}');
    expect(result).toBeInstanceOf(Promise);
    expect(await result).toEqual({ sync: 1, async: 2 });
  });

  test("Complex nested async expressions", async () => {
    evaluator.addExpressionFunction("asyncValue", async (ctx, val) => {
      return Promise.resolve(val);
    });

    evaluator.addExpressionFunction("asyncTrue", async () => {
      return Promise.resolve(true);
    });

    // Complex expression combining multiple async features
    const result = evaluator.evaluate(
      "asyncTrue() && asyncValue(5) > 3 ? [asyncValue(1), asyncValue(2)] : []",
    );

    expect(result).toBeInstanceOf(Promise);
    expect(await result).toEqual([1, 2]);
  });

  test("Mixed Promise and non-Promise in complex expression", async () => {
    evaluator.addExpressionFunction("asyncValue", async (ctx, val) => {
      return Promise.resolve(val);
    });

    // This should handle the case where some parts are async and others are sync
    const result = evaluator.evaluate(
      "true && asyncValue(false) ? 'should-not-reach' : 'correct'",
    );

    expect(result).toBeInstanceOf(Promise);
    expect(await result).toBe("correct");
  });

  test("conditional function with evaluateAsync vs evaluate", async () => {
    // Test with sync evaluate
    model.set([["local.test", "bla"]]);
    const syncResult = evaluator.evaluate(
      "conditional(false,{{local.test}}='TRUE',{{local.test}}='FALSE')",
      { model },
    );
    expect(syncResult).toBe("FALSE");
    expect(model.get("local.test")).toBe("FALSE");

    // Reset model
    model.set([["local.test", "bla"]]);

    // Test with async evaluateAsync
    const asyncResult = await evaluator.evaluateAsync(
      "conditional(false,{{local.test}}='TRUE',{{local.test}}='FALSE')",
      { model },
    );
    expect(asyncResult).toBe("FALSE");
    expect(model.get("local.test")).toBe("FALSE");
  });
});
