import { bench, describe } from "vitest";
import type { DataModelWithParser } from "../data";
import { LocalModel, withParser } from "../data";
import { BindingParser } from "../binding";
import { ExpressionEvaluator } from "../expressions";
import type { Options } from "../string-resolver";
import {
  resolveDataRefs,
  resolveDataRefsInString,
  resolveExpressionsInString,
} from "../string-resolver";

const localModel = new LocalModel({
  user: { name: "Ada", title: "Dr" },
  a: "alpha",
  b: "beta",
  c: "gamma",
});

const bindingParser = new BindingParser({
  get: localModel.get,
  set: localModel.set,
  evaluate: (exp) => evaluator.evaluate(exp),
});

const model: DataModelWithParser = withParser(localModel, bindingParser.parse);
const evaluator = new ExpressionEvaluator({ model });

const options: Options = {
  model,
  evaluate: (exp) => evaluator.evaluate(exp),
};

/** A flat object with a mix of ref-bearing and plain string values */
const flatObject = Object.fromEntries(
  Array.from({ length: 30 }, (_, i) => [
    `key${i}`,
    i % 3 === 0 ? `value {{a}} and {{b}}` : `plain value ${i}`,
  ]),
);

/** A depth-3 nested object to exercise the recursive traversal */
const nestedObject = {
  level1: {
    title: "Hi {{user.name}}",
    level2: {
      label: "{{user.title}} {{user.name}}",
      level3: { note: "plain", value: "{{a}}" },
    },
    items: ["{{b}}", "plain", "{{c}}"],
  },
};

describe("resolveExpressionsInString", () => {
  bench(
    "single expression",
    () => {
      resolveExpressionsInString("@[ 1 + 2 ]@", options);
    },
    { iterations: 10000 },
  );

  bench(
    "embedded expressions",
    () => {
      resolveExpressionsInString(
        "prefix @[ 1 + 2 ]@ middle @[ 3 + 4 ]@ suffix",
        options,
      );
    },
    { iterations: 10000 },
  );
});

describe("resolveDataRefsInString", () => {
  bench(
    "single ref",
    () => {
      resolveDataRefsInString("{{user.name}}", options);
    },
    { iterations: 10000 },
  );

  bench(
    "multiple refs",
    () => {
      resolveDataRefsInString(
        "Hi {{user.name}}, you are {{user.title}} from {{a}}",
        options,
      );
    },
    { iterations: 10000 },
  );

  bench(
    "no refs (fast exit)",
    () => {
      resolveDataRefsInString("just a plain string with no refs", options);
    },
    { iterations: 10000 },
  );
});

describe("resolveDataRefs object", () => {
  bench(
    "flat (30 keys)",
    () => {
      resolveDataRefs(flatObject, options);
    },
    { iterations: 10000 },
  );

  bench(
    "nested (depth 3)",
    () => {
      resolveDataRefs(nestedObject, options);
    },
    { iterations: 10000 },
  );
});
