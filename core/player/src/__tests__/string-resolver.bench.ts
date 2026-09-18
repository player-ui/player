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

/**
 * A large, realistic view-data structure: many sections, each with arrays of
 * fields carrying a mix of ref-bearing and plain strings (~300 nodes, depth 5,
 * with arrays). Exercises the recursive traverse + the single-clone path far
 * more thoroughly than the small fixtures above.
 */
const largeNestedObject = {
  meta: { author: "{{user.name}}", revision: "plain-rev", count: 80 },
  sections: Array.from({ length: 8 }, (_, s) => ({
    id: `section-${s}`,
    title: `Section ${s} for {{user.name}}`,
    description: "static description with no refs",
    fields: Array.from({ length: 10 }, (_, f) => ({
      id: `field-${s}-${f}`,
      label: `{{a}} label ${f}`,
      value: f % 2 ? `{{b}}` : `static ${f}`,
      help: { text: "Help {{c}}", visible: true, order: f },
      options: ["{{a}}", "plain", "{{b}}"],
    })),
  })),
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

  bench(
    "large nested (8 sections x 10 fields, depth 5)",
    () => {
      resolveDataRefs(largeNestedObject, options);
    },
    { iterations: 1000 },
  );
});
