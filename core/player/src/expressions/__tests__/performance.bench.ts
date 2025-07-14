import { describe, bench } from "vitest";
import type { DataModelWithParser } from "../../data";
import { LocalModel, withParser } from "../../data";
import { BindingParser } from "../../binding";
import type { ExpressionType } from "..";
import { ExpressionEvaluator } from "..";
describe("Expression Parsing/Execution Benchmark", () => {
  const testCases: Array<string> = [
    "{{foo}} = 1 + 3",
    "conditional(true, true, false)",
    "{{foo}} = conditional({{bar}} > 0, true, false)",
    "{{foo}} = conditional(conditional(true = false, false, true), conditional(false = false, true, false), conditional(true = true, false, true))",
    "{{foo}} = await(asyncTestFunction(1))",
    "{{foo}} = asyncTestFunction(1)",
    "asyncTestFunction(1)",
    "{{foo}} = conditional(!{{bar}} == false, await(asyncTestFunction(1)), false)",
  ];

  testCases.forEach((testExpression) => {
    const localModel = new LocalModel();
    const bindingParser = new BindingParser({
      get: localModel.get,
      set: localModel.set,
      evaluate: (exp: ExpressionType) => {
        return evaluator.evaluate(exp);
      },
    });

    const model: DataModelWithParser = withParser(
      localModel,
      bindingParser.parse,
    );
    const evaluator: ExpressionEvaluator = new ExpressionEvaluator({ model });

    evaluator.addExpressionFunction(
      "asyncTestFunction",
      async (context, arg) => {
        return Promise.resolve((arg as number) + 2);
      },
    );

    bench(
      `Parsing: ${testExpression} (sync)`,
      () => {
        evaluator.evaluate(testExpression);
        // look at data models
      },
      { iterations: 10000 },
    );
    bench(
      `Parsing: ${testExpression} (async)`,
      async () => {
        await evaluator.evaluateAsync(testExpression);
      },
      { iterations: 10000 },
    );
  });
});
