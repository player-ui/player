import type { ExpressionHandler } from './types';

/** Generates a function by removing the first context argument */
export function withoutContext<T extends unknown[], Return>(
  fn: (...args: T) => Return
): ExpressionHandler<T, Return> {
  return (_context, ...args) => fn(...args);
}
