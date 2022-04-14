import { expression as e } from '..';

test('works with nested expressions', () => {
  const exp1 = e`foo() == bar()`;
  const exp2 = e`conditional(${exp1})`;

  expect(exp2.toString()).toBe(`@[conditional(foo() == bar())]@`);
});
