import type { ExpressionHandler } from "@player-ui/player";

/** Truthy when value is present and non-empty. */
export const required: ExpressionHandler<[unknown], boolean> = (
  _ctx,
  value,
) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/** Truthy when String(value) matches `pattern`. */
export const regex: ExpressionHandler<[unknown, string], boolean> = (
  _ctx,
  value,
  pattern,
) => {
  if (value === null || value === undefined || !pattern) return false;
  try {
    return new RegExp(pattern).test(String(value));
  } catch {
    return false;
  }
};

/** Truthy when String(value).length is within [min, max]. Bounds optional. */
export const length: ExpressionHandler<
  [unknown, number | undefined, number | undefined],
  boolean
> = (_ctx, value, min, max) => {
  if (value === null || value === undefined) return false;
  const len = String(value).length;
  const lo = typeof min === "number" ? min : -Infinity;
  const hi = typeof max === "number" ? max : Infinity;
  return len >= lo && len <= hi;
};

/** Truthy when Number(value) is in range [min, max]. */
export const numeric: ExpressionHandler<
  [unknown, number | undefined, number | undefined],
  boolean
> = (_ctx, value, min, max) => {
  const n = Number(value);
  if (Number.isNaN(n)) return false;
  const lo = typeof min === "number" ? min : -Infinity;
  const hi = typeof max === "number" ? max : Infinity;
  return n >= lo && n <= hi;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Truthy when value looks like an email address. */
export const email: ExpressionHandler<[unknown], boolean> = (_ctx, value) => {
  if (typeof value !== "string") return false;
  return EMAIL_RE.test(value);
};
