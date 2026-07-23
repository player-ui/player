import type { ExpressionHandler, ValidatorFunction } from "@player-ui/player";

function checkRequired(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** Truthy when value is present and non-empty. */
export const required: ExpressionHandler<[unknown], boolean> = (_ctx, value) =>
  checkRequired(value);

/** Player validator counterpart of {@link required}. */
export const requiredValidator: ValidatorFunction = (context, value) => {
  if (!checkRequired(value)) {
    const message = context.constants.getConstants(
      "validation.required",
      "constants",
      "A value is required",
    ) as string;

    return { message };
  }
};

function checkRegex(value: unknown, pattern: string | undefined): boolean {
  if (value === null || value === undefined || !pattern) return false;
  try {
    return new RegExp(pattern).test(String(value));
  } catch {
    return false;
  }
}

/** Truthy when String(value) matches `pattern`. */
export const regex: ExpressionHandler<[unknown, string], boolean> = (
  _ctx,
  value,
  pattern,
) => checkRegex(value, pattern);

/** Player validator counterpart of {@link regex}. */
export const regexValidator: ValidatorFunction<{
  /** The pattern to test the value against */
  regex?: string;
}> = (context, value, options) => {
  if (value === null || value === undefined) return;

  if (!checkRegex(value, options?.regex)) {
    const message = context.constants.getConstants(
      "validation.regex",
      "constants",
      "Invalid entry",
    ) as string;

    return { message };
  }
};

function checkLength(
  value: unknown,
  min: number | undefined,
  max: number | undefined,
): boolean {
  if (value === null || value === undefined) return false;
  const len = String(value).length;
  const lo = typeof min === "number" ? min : -Infinity;
  const hi = typeof max === "number" ? max : Infinity;
  return len >= lo && len <= hi;
}

/** Truthy when String(value).length is within [min, max]. Bounds optional. */
export const length: ExpressionHandler<
  [unknown, number | undefined, number | undefined],
  boolean
> = (_ctx, value, min, max) => checkLength(value, min, max);

/** Player validator counterpart of {@link length}. */
export const lengthValidator: ValidatorFunction<{
  /** The minimum length to check against */
  min?: number;

  /** The maximum length to check against */
  max?: number;
}> = (context, value, options) => {
  if (value === null || value === undefined) return;

  if (!checkLength(value, options?.min, options?.max)) {
    const message = context.constants.getConstants(
      "validation.length",
      "constants",
      "Invalid length",
    ) as string;

    return { message };
  }
};

function checkNumeric(
  value: unknown,
  min: number | undefined,
  max: number | undefined,
): boolean {
  const n = Number(value);
  if (Number.isNaN(n)) return false;
  const lo = typeof min === "number" ? min : -Infinity;
  const hi = typeof max === "number" ? max : Infinity;
  return n >= lo && n <= hi;
}

/** Truthy when Number(value) is in range [min, max]. */
export const numeric: ExpressionHandler<
  [unknown, number | undefined, number | undefined],
  boolean
> = (_ctx, value, min, max) => checkNumeric(value, min, max);

/** Player validator counterpart of {@link numeric}. */
export const numericValidator: ValidatorFunction<{
  /** The minimum value to check against */
  min?: number;

  /** The maximum value to check against */
  max?: number;
}> = (context, value, options) => {
  if (value === null || value === undefined) return;

  if (!checkNumeric(value, options?.min, options?.max)) {
    const message = context.constants.getConstants(
      "validation.numeric",
      "constants",
      "Value must be a number",
    ) as string;

    return { message };
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function checkEmail(value: unknown): boolean {
  return typeof value === "string" && EMAIL_RE.test(value);
}

/** Truthy when value looks like an email address. */
export const email: ExpressionHandler<[unknown], boolean> = (_ctx, value) =>
  checkEmail(value);

/** Player validator counterpart of {@link email}. */
export const emailValidator: ValidatorFunction = (context, value) => {
  if (value === null || value === undefined || value === "") return;

  if (!checkEmail(value)) {
    const message = context.constants.getConstants(
      "validation.email",
      "constants",
      "Improper email format",
    ) as string;

    return { message };
  }
};
