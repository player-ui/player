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

/**
 * The A2UI bundle runs on multiple JS engines. Browsers (React) and Node (tests)
 * ship the full `Intl` API, but the Hermes engine used by the JVM/Android player
 * is built without it. Each formatter below prefers the real `Intl` and falls
 * back to a locale-light pure-JS implementation only when the relevant `Intl`
 * constructor is missing. The fallbacks target readable en-US-style output — they
 * intentionally do not reproduce per-locale separators/symbols (Hermes carries no
 * locale data), but they never throw.
 */
const hasIntl = (ctor: keyof typeof Intl): boolean =>
  typeof Intl !== "undefined" && typeof (Intl as never)[ctor] === "function";

/** Group the integer part with `,` and join the fraction with `.` (en-US style). */
function groupThousands(n: number, fractionDigits?: number): string {
  const fixed =
    fractionDigits === undefined ? String(n) : n.toFixed(fractionDigits);
  const negative = fixed.startsWith("-");
  const [intPart, fracPart] = (negative ? fixed.slice(1) : fixed).split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const out = fracPart ? `${grouped}.${fracPart}` : grouped;
  return negative ? `-${out}` : out;
}

/** Minimal en-US currency symbols; unmapped codes fall back to `"<CODE> <amt>"`. */
const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "$",
  AUD: "$",
};

/** `Intl.NumberFormat` wrapper. 2nd arg can be a locale string OR options. */
export const formatNumber: ExpressionHandler<
  [unknown, NumberFormatArg?, Intl.NumberFormatOptions?],
  string
> = (_ctx, value, a, b) => {
  const n = Number(value);
  if (Number.isNaN(n)) return String(value ?? "");
  const { locale, options } = pickNumberLocaleAndOptions(a, b);
  if (hasIntl("NumberFormat")) {
    return new Intl.NumberFormat(locale, options).format(n);
  }
  // Fallback: en-US grouping, honoring percent style + fraction-digit bounds.
  if (options?.style === "percent") {
    const digits = options.maximumFractionDigits ?? 0;
    return `${groupThousands(n * 100, digits)}%`;
  }
  const min = options?.minimumFractionDigits;
  const max = options?.maximumFractionDigits;
  const digits = max ?? min;
  return groupThousands(n, digits);
};

/** `Intl.NumberFormat` in currency style. */
export const formatCurrency: ExpressionHandler<
  [unknown, string, string?],
  string
> = (_ctx, value, currency, locale) => {
  const n = Number(value);
  if (Number.isNaN(n) || !currency) return String(value ?? "");
  if (hasIntl("NumberFormat")) {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(n);
  }
  // Fallback: en-US grouping to 2 decimals, prefixed with a known symbol.
  const amount = groupThousands(n, 2);
  const symbol = CURRENCY_SYMBOLS[currency];
  return symbol ? `${symbol}${amount}` : `${currency} ${amount}`;
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
  if (hasIntl("DateTimeFormat")) {
    return new Intl.DateTimeFormat(locale, options).format(date);
  }
  return formatDateFallback(date, pattern);
};

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Locale-light date rendering for engines without `Intl.DateTimeFormat`. */
function formatDateFallback(date: Date, pattern?: string): string {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const pad = (v: number) => String(v).padStart(2, "0");
  switch (pattern) {
    case "short":
      // en-US numeric: M/D/YYYY
      return `${m + 1}/${d}/${y}`;
    case "medium":
    case "long":
    case "full":
      return `${MONTHS_SHORT[m]} ${d}, ${y}`;
    default:
      return `${y}-${pad(m + 1)}-${pad(d)}`;
  }
}

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
  const category = hasIntl("PluralRules")
    ? new Intl.PluralRules(options.locale).select(n)
    : // Fallback: minimal English plural rule (Hermes has no PluralRules).
      n === 1
      ? "one"
      : "other";
  return options[category] ?? options.other ?? options.default ?? "";
};
