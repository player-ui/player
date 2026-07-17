import type { ExpressionHandler } from "@player-ui/player";

/**
 * The A2UI adapter pre-translates `formatString` calls into Player template
 * strings, so this runtime handler only runs in the fallback case (non-string
 * `value` arg). Coerce all inputs to strings and concatenate; binding
 * interpolation `{{...}}` is handled by Player's string-resolver downstream.
 */
export const formatString: ExpressionHandler<unknown[], string> = (
  _ctx,
  ...parts
) =>
  parts.map((p) => (p === null || p === undefined ? "" : String(p))).join("");

type NumberFormatArg = string | Intl.NumberFormatOptions | undefined;

function pickNumberLocaleAndOptions(
  a?: NumberFormatArg,
  b?: Intl.NumberFormatOptions,
): { locale?: string; options?: Intl.NumberFormatOptions } {
  if (typeof a === "string") return { locale: a, options: b };
  if (a && typeof a === "object") return { locale: undefined, options: a };
  return { locale: undefined, options: b };
}

/** `Intl.NumberFormat` wrapper. 2nd arg can be a locale string OR options. */
export const formatNumber: ExpressionHandler<
  [unknown, NumberFormatArg?, Intl.NumberFormatOptions?],
  string
> = (_ctx, value, a, b) => {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  const { locale, options } = pickNumberLocaleAndOptions(a, b);
  return new Intl.NumberFormat(locale, options).format(n);
};

/** `Intl.NumberFormat` in currency style. */
export const formatCurrency: ExpressionHandler<
  [unknown, string, string?],
  string
> = (_ctx, value, currency, locale) => {
  const n = Number(value);
  if (Number.isNaN(n) || !currency) return String(value ?? "");
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(n);
};

const DATE_STYLE_MAP: Record<string, Intl.DateTimeFormatOptions> = {
  short: { dateStyle: "short" },
  medium: { dateStyle: "medium" },
  long: { dateStyle: "long" },
  full: { dateStyle: "full" },
};

/**
 * `Intl.DateTimeFormat` wrapper. `pattern` accepts the four CLDR style names
 * (short/medium/long/full); unknown patterns fall back to the locale default.
 */
export const formatDate: ExpressionHandler<
  [unknown, string?, string?],
  string
> = (_ctx, value, pattern, locale) => {
  const date =
    value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(date.getTime())) return String(value ?? "");
  const options = pattern ? DATE_STYLE_MAP[pattern] : undefined;
  return new Intl.DateTimeFormat(locale, options).format(date);
};

type PluralOptions = Partial<
  Record<Intl.LDMLPluralRule | "default", string>
> & { locale?: string };

/**
 * Picks a string from `options` based on CLDR plural category for `count`.
 * Accepts the standard categories (zero/one/two/few/many/other) plus
 * `default` as the final fallback.
 */
export const pluralize: ExpressionHandler<[unknown, PluralOptions], string> = (
  _ctx,
  count,
  options,
) => {
  const n = Number(count);
  if (!options || typeof options !== "object" || Number.isNaN(n)) return "";
  const category = new Intl.PluralRules(options.locale).select(n);
  return options[category] ?? options.other ?? options.default ?? "";
};
