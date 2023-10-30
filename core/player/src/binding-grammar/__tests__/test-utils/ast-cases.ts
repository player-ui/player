import type { PathNode } from '../../ast';
import {
  toValue,
  toQuery,
  toConcatenatedNode,
  toPath,
  toExpression,
} from '../../ast';

export const VALID_AST_PARSER_TESTS: Array<[string, PathNode]> = [
  // Basic ones
  ['', toPath([])],
  ['foo', toPath([toValue('foo')])],
  ['foo.bar', toPath([toValue('foo'), toValue('bar')])],
  ['1234567890_ABC_abc', toPath([toValue('1234567890_ABC_abc')])],
  ['a-b-c-d-', toPath([toValue('a-b-c-d-')])],

  // Queries
  [
    'foo[x=something]',
    toPath([toValue('foo'), toQuery(toValue('x'), toValue('something'))]),
  ],
  [
    'foo[x == something]',
    toPath([toValue('foo'), toQuery(toValue('x'), toValue('something'))]),
  ],
  [
    'foo[x === something]',
    toPath([toValue('foo'), toQuery(toValue('x'), toValue('something'))]),
  ],
  [
    `foo[x = 'something']`,
    toPath([toValue('foo'), toQuery(toValue('x'), toValue('something'))]),
  ],
  [
    'foo[x == "something"]',
    toPath([toValue('foo'), toQuery(toValue('x'), toValue('something'))]),
  ],
  [
    'foo["x"         =           "something"]',
    toPath([toValue('foo'), toQuery(toValue('x'), toValue('something'))]),
  ],
  [
    `foo['x'='hello [!@#$%^&*().]']`,
    toPath([
      toValue('foo'),
      toQuery(toValue('x'), toValue('hello [!@#$%^&*().]')),
    ]),
  ],
  [
    `foo['Month'='New[.]]Mo,nth.']`,
    toPath([
      toValue('foo'),
      toQuery(toValue('Month'), toValue('New[.]]Mo,nth.')),
    ]),
  ],

  // Nested Paths
  ['{{foo}}', toPath([toPath([toValue('foo')])])],
  ['{{hello.world}}', toPath([toPath([toValue('hello'), toValue('world')])])],
  [
    'foo.bar.{{nested}}.baz',
    toPath([
      toValue('foo'),
      toValue('bar'),
      toPath([toValue('nested')]),
      toValue('baz'),
    ]),
  ],
  [
    'foo[{{bar}}].baz',
    toPath([toValue('foo'), toPath([toValue('bar')]), toValue('baz')]),
  ],

  // Brackets
  [
    'foo[a][b][c]',
    toPath([toValue('foo'), toValue('a'), toValue('b'), toValue('c')]),
  ],
  [
    `foo['a']["b"][c="bar"]`,
    toPath([
      toValue('foo'),
      toValue('a'),
      toValue('b'),
      toQuery(toValue('c'), toValue('bar')),
    ]),
  ],
  [
    'foo[a][b == " [x    ]" ][c]',
    toPath([
      toValue('foo'),
      toValue('a'),
      toQuery(toValue('b'), toValue(' [x    ]')),
      toValue('c'),
    ]),
  ],

  // Multi-Nodes
  [
    '_hello_{{world}}',
    toPath([
      toConcatenatedNode([toValue('_hello_'), toPath([toValue('world')])]),
    ]),
  ],
  [
    '_hello_{{world}}_foo_',
    toPath([
      toConcatenatedNode([
        toValue('_hello_'),
        toPath([toValue('world')]),
        toValue('_foo_'),
      ]),
    ]),
  ],
  [
    '{{hello}}{{world}}',
    toPath([
      toConcatenatedNode([
        toPath([toValue('hello')]),
        toPath([toValue('world')]),
      ]),
    ]),
  ],
  [
    '{{hello}}_foobar_{{world}}',
    toPath([
      toConcatenatedNode([
        toPath([toValue('hello')]),
        toValue('_foobar_'),
        toPath([toValue('world')]),
      ]),
    ]),
  ],
  [
    '{{hello}}_world_',
    toPath([
      toConcatenatedNode([toPath([toValue('hello')]), toValue('_world_')]),
    ]),
  ],
  [
    '{{hello}}_world',
    toPath([
      toConcatenatedNode([toPath([toValue('hello')]), toValue('_world')]),
    ]),
  ],
  [
    'foo.{{hello}}_world',
    toPath([
      toValue('foo'),
      toConcatenatedNode([toPath([toValue('hello')]), toValue('_world')]),
    ]),
  ],

  // Expressions
  [
    'foo.`bar()`.baz',
    toPath([toValue('foo'), toExpression('bar()'), toValue('baz')]),
  ],
  [
    'foo`bar()`.baz',
    toPath([
      toConcatenatedNode([toValue('foo'), toExpression('bar()')]),
      toValue('baz'),
    ]),
  ],
  [
    'foo[`bar()`].baz',
    toPath([toValue('foo'), toExpression('bar()'), toValue('baz')]),
  ],
  [
    'foo["readonly" = `foo() == bar()`].baz',
    toPath([
      toValue('foo'),
      toQuery(toValue('readonly'), toExpression('foo() == bar()')),
      toValue('baz'),
    ]),
  ],
];

export const INVALID_AST_PARSER_TESTS: Array<string> = [
  ' ',
  '@#$%^&*()',
  '.',
  'foo.bar[',
  'foo.bar.{{nested.}',
  'foo.bar`not done()',
];

export const VALID_AST_PARSER_CUSTOM_TESTS: Array<[string, PathNode]> = [
  ['foo‑<>~¡¢£', toPath([toValue('foo‑<>~¡¢£')])],
  ['foo.bar<>~¡¢£', toPath([toValue('foo'), toValue('bar<>~¡¢£')])],
  [
    'foo[{{b‑ar}}].baz',
    toPath([toValue('foo'), toPath([toValue('b‑ar')]), toValue('baz')]),
  ],
];
