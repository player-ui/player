import flatten from 'arr-flatten';
import type { Parser } from 'parsimmon';
import P from 'parsimmon';
import type { Parser as BindingParser } from '../ast';
import {
  toValue,
  toConcatenatedNode,
  toQuery,
  toPath,
  toExpression,
} from '../ast';

const doubleQuote = P.string('"');
const singleQuote = P.string("'");
const backTick = P.string('`');

const identifier = P.regex(/[\w\-@]+/)
  .desc('identifier')
  .map(toValue);

// eslint-disable-next-line prefer-const
let path: Parser<any>;

const futurePath = P.lazy(() => path);
const nestedPath = futurePath
  .trim(P.optWhitespace)
  .wrap(P.string('{{'), P.string('}}'))
  .map(toPath);

const nestedExpression = P.regex(/[^`]*/)
  .wrap(backTick, backTick)
  .map(toExpression);

const segment = P.alt(identifier, nestedPath, nestedExpression)
  .atLeast(1)
  .map(flatten)
  .map(toConcatenatedNode as any);

const optionallyQuotedSegment = P.alt(
  P.regex(/[^"]*/).wrap(doubleQuote, doubleQuote).map(toValue),
  P.regex(/[^']*/).wrap(singleQuote, singleQuote).map(toValue),
  segment,
);

const query = P.seq(
  optionallyQuotedSegment,
  P.string('=').times(1, 3).trim(P.optWhitespace),
  optionallyQuotedSegment,
).map(([key, , value]) => toQuery(key as any, value as any));

const brackets = P.alt(query, optionallyQuotedSegment)
  .trim(P.optWhitespace)
  .wrap(P.string('['), P.string(']'))
  .many();

const segmentAndBrackets = P.seqMap(segment, brackets, (s, bs) => [s, ...bs]);

path = P.sepBy(segmentAndBrackets, P.string('.')).map(flatten);

/** Parse a binding using parsimmon */
export const parse: BindingParser = (binding) => {
  const result = path.parse(binding);

  if (result.status) {
    return {
      status: true,
      path: {
        name: 'PathNode',
        path: result.value,
      },
    };
  }

  return {
    status: false,
    error: result.expected[0],
  };
};
