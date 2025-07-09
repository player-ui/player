import { bench, describe } from "vitest";
import get from "dlv";
import { BindingInstance, getBindingSegments } from "..";
import { testCases, testModel } from "./resolver.test";
import { parseCustom, ParserSuccessResult } from "../../binding-grammar";
import { resolveBindingAST } from "../resolver";

describe.skip("parser benchmarks", () => {
  testCases.map(
    ([input, expectedOutput]) => {
      bench(`Resolving binding: ${input}`, () => {
        const parsedBinding = parseCustom(input);
        resolveBindingAST((parsedBinding as ParserSuccessResult).path, {
          getValue: (path) => get(testModel, getBindingSegments(path) as any),
          convertToPath: (p) => p,
          evaluate: () => undefined,
        });
      });
    },
    { iterations: 10000 },
  );
});

describe.skip("binding creation benchmarks", () => {
  testCases.map(
    ([input, expectedOutput]) => {
      bench(`Resolving binding: ${input}`, () => {
        const parsedBinding = parseCustom(input);
        const result = resolveBindingAST(
          (parsedBinding as ParserSuccessResult).path,
          {
            getValue: (path) => get(testModel, getBindingSegments(path) as any),
            convertToPath: (p) => p,
            evaluate: () => undefined,
          },
        );
        new BindingInstance(result.path);
      });
    },
    { iterations: 10000 },
  );
});
