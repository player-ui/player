import {
  VALID_AST_PARSER_TESTS,
  INVALID_AST_PARSER_TESTS,
} from './test-utils/ast-cases';
import type { ParserSuccessResult, ParserFailureResult } from '../ast';
import { parse as parseParsimmon } from '../parsimmon';
import { parse as parseEBNF } from '../ebnf';
import { parse as parseCustom } from '../custom';

describe('parsimmon', () => {
  test.each(VALID_AST_PARSER_TESTS)('Parsimmon Valid: %s', (binding, AST) => {
    const result = parseParsimmon(binding);

    expect(result.status).toBe(true);
    expect((result as ParserSuccessResult).path).toStrictEqual(AST);
  });

  test.each(INVALID_AST_PARSER_TESTS)('Parsimmon Invalid: %s', (binding) => {
    const result = parseParsimmon(binding);
    expect(result.status).toBe(false);
    expect((result as ParserFailureResult).error.length > 0).toBe(true);
  });
});

describe('ebnf', () => {
  test.each(VALID_AST_PARSER_TESTS)('EBNF Valid: %s', (binding, AST) => {
    const result = parseEBNF(binding);

    expect(result.status).toBe(true);
    expect((result as ParserSuccessResult).path).toStrictEqual(AST);
  });

  test.each(INVALID_AST_PARSER_TESTS)('EBNF Invalid: %s', (binding) => {
    const result = parseEBNF(binding);
    expect(result.status).toBe(false);
    expect((result as ParserFailureResult).error.length > 0).toBe(true);
  });
});

describe('custom', () => {
  test.each(VALID_AST_PARSER_TESTS)('Custom Valid: %s', (binding, AST) => {
    const result = parseCustom(binding);
    expect(result.status).toBe(true);
    expect((result as ParserSuccessResult).path).toStrictEqual(AST);
  });

  test.each(INVALID_AST_PARSER_TESTS)('Custom Invalid: %s', (binding) => {
    const result = parseCustom(binding);
    expect(result.status).toBe(false);
    expect((result as ParserFailureResult).error.length > 0).toBe(true);
  });
});
