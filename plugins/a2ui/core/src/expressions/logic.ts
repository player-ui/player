import type { ExpressionHandler } from "@player-ui/player";

export const and: ExpressionHandler<unknown[], boolean> = (_ctx, ...args) =>
  args.every(Boolean);

export const or: ExpressionHandler<unknown[], boolean> = (_ctx, ...args) =>
  args.some(Boolean);

export const not: ExpressionHandler<[unknown], boolean> = (_ctx, value) =>
  !value;
