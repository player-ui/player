import { VALID_AST_PARSER_TESTS } from "./ast-cases";
import { parse as parseParsimmon } from "../../parsimmon";
import { parse as parseEBNF } from "../../ebnf";
import { parse as parseCustom } from "../../custom";

import type { Parser } from "../../ast";

const parsers: Array<{
  /** The name of the parser being tested */
  name: string;

  /** The parse function  */
  parser: Parser;
}> = [
  { name: "parsimmon", parser: parseParsimmon },
  { name: "ebnf", parser: parseEBNF },
  { name: "custom", parser: parseCustom },
];

const VALID_ITERATIONS = 1000;

/** Execute 1 iteration of the parser test */
const runOnce = (parser: Parser): number => {
  const start = Date.now();

  for (const testCase of VALID_AST_PARSER_TESTS) {
    parser(testCase[0]);
  }

  const end = Date.now();

  return end - start;
};

/** Run all parser perf tests */
export const testAll = () => {
  const results: Array<{
    /** The name of the parser */
    name: string;

    /** How long it took overall */
    time: number;

    /** Average number of bindings parsed per sec */
    opsPerSec: number;
  }> = [];

  for (const parser of parsers) {
    const runs = [];

    for (let i = 0; i < VALID_ITERATIONS; i++) {
      runs.push(runOnce(parser.parser));
    }

    const total = runs.reduce((s, n) => s + n);
    const opsPerSec =
      (VALID_ITERATIONS * VALID_AST_PARSER_TESTS.length) / (total / 1000);
    results.push({
      name: parser.name,
      time: total,
      opsPerSec,
    });
  }

  console.table(results);
};
