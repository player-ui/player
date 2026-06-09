import { describe, it, expect } from "vitest";
import {
  and,
  email,
  formatCurrency,
  formatDate,
  formatNumber,
  formatString,
  length,
  not,
  numeric,
  openUrl,
  or,
  pluralize,
  regex,
  required,
} from "../expressions";

const ctx = {} as any;

describe("a2ui expressions — validation", () => {
  it("required", () => {
    expect(required(ctx, null)).toBe(false);
    expect(required(ctx, undefined)).toBe(false);
    expect(required(ctx, "")).toBe(false);
    expect(required(ctx, [])).toBe(false);
    expect(required(ctx, "x")).toBe(true);
    expect(required(ctx, 0)).toBe(true);
    expect(required(ctx, false)).toBe(true);
  });

  it("regex", () => {
    expect(regex(ctx, "abc123", "^[a-z]+\\d+$")).toBe(true);
    expect(regex(ctx, "ABC", "^[a-z]+$")).toBe(false);
    expect(regex(ctx, null, ".*")).toBe(false);
    expect(regex(ctx, "x", "(")).toBe(false); // invalid regex
  });

  it("length", () => {
    expect(length(ctx, "hello", 3, 10)).toBe(true);
    expect(length(ctx, "hi", 3, 10)).toBe(false);
    expect(length(ctx, "way too long for this", 3, 10)).toBe(false);
    expect(length(ctx, "anything", undefined, undefined)).toBe(true);
    expect(length(ctx, null, 0, 1)).toBe(false);
  });

  it("numeric", () => {
    expect(numeric(ctx, 5, 1, 10)).toBe(true);
    expect(numeric(ctx, "5", 1, 10)).toBe(true);
    expect(numeric(ctx, 15, 1, 10)).toBe(false);
    expect(numeric(ctx, "not a number", 0, 1)).toBe(false);
    expect(numeric(ctx, -1, undefined, 0)).toBe(true);
  });

  it("email", () => {
    expect(email(ctx, "a@b.co")).toBe(true);
    expect(email(ctx, "not-an-email")).toBe(false);
    expect(email(ctx, "")).toBe(false);
    expect(email(ctx, null)).toBe(false);
  });
});

describe("a2ui expressions — format", () => {
  it("formatString concatenates parts", () => {
    expect(formatString(ctx, "Hi ", "Bob", "!")).toBe("Hi Bob!");
    expect(formatString(ctx, "x", null, "y", undefined)).toBe("xy");
  });

  it("formatNumber respects locale + options", () => {
    expect(formatNumber(ctx, 1234.5, "en-US")).toBe("1,234.5");
    expect(formatNumber(ctx, 1234.5, "de-DE")).toBe("1.234,5");
    expect(formatNumber(ctx, 0.5, { style: "percent" })).toBe(
      new Intl.NumberFormat(undefined, { style: "percent" }).format(0.5),
    );
    expect(formatNumber(ctx, "not a number")).toBe("not a number");
  });

  it("formatCurrency", () => {
    expect(formatCurrency(ctx, 9.99, "USD", "en-US")).toBe("$9.99");
    expect(formatCurrency(ctx, 9.99, "EUR", "de-DE")).toContain("9,99");
  });

  it("formatDate", () => {
    const iso = "2024-01-15T00:00:00.000Z";
    const out = formatDate(ctx, iso, "short", "en-US");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
    expect(formatDate(ctx, "bogus")).toBe("bogus");
  });

  it("pluralize selects by CLDR category", () => {
    const opts = { one: "1 item", other: "{n} items", locale: "en-US" };
    expect(pluralize(ctx, 1, opts)).toBe("1 item");
    expect(pluralize(ctx, 4, opts)).toBe("{n} items");
    expect(pluralize(ctx, 0, opts)).toBe("{n} items"); // en pl(0) === "other"
    expect(pluralize(ctx, 1, { default: "fallback", locale: "en-US" })).toBe(
      "fallback",
    );
  });
});

describe("a2ui expressions — format fallbacks (no Intl)", () => {
  // The Hermes engine (JVM/Android) lacks `Intl`; exercise the pure-JS fallback
  // by removing the global for the duration of each assertion.
  const withoutIntl = (fn: () => void) => {
    const realIntl = (globalThis as any).Intl;
    (globalThis as any).Intl = undefined;
    try {
      fn();
    } finally {
      (globalThis as any).Intl = realIntl;
    }
  };

  it("formatNumber groups en-US style", () => {
    withoutIntl(() => {
      expect(formatNumber(ctx, 1234.5, "en-US")).toBe("1,234.5");
      expect(formatNumber(ctx, 1234567, "en-US")).toBe("1,234,567");
      expect(formatNumber(ctx, 0.5, { style: "percent" })).toBe("50%");
      expect(formatNumber(ctx, "not a number")).toBe("not a number");
    });
  });

  it("formatCurrency prefixes a known symbol", () => {
    withoutIntl(() => {
      expect(formatCurrency(ctx, 1299.5, "USD", "en-US")).toBe("$1,299.50");
      expect(formatCurrency(ctx, 9.99, "USD")).toBe("$9.99");
      // Unmapped currency falls back to a code prefix.
      expect(formatCurrency(ctx, 5, "ZZZ")).toBe("ZZZ 5.00");
    });
  });

  it("formatDate renders a non-empty string", () => {
    withoutIntl(() => {
      const iso = "2024-01-15T00:00:00.000Z";
      expect(formatDate(ctx, iso, "short")).toEqual(expect.any(String));
      expect(formatDate(ctx, iso, "short").length).toBeGreaterThan(0);
      expect(formatDate(ctx, "bogus")).toBe("bogus");
    });
  });

  it("pluralize uses minimal English rule", () => {
    withoutIntl(() => {
      const opts = { one: "1 item", other: "{n} items" };
      expect(pluralize(ctx, 1, opts)).toBe("1 item");
      expect(pluralize(ctx, 2, opts)).toBe("{n} items");
      expect(pluralize(ctx, 0, opts)).toBe("{n} items");
    });
  });
});

describe("a2ui expressions — logic", () => {
  it("and / or / not", () => {
    expect(and(ctx, true, true, 1)).toBe(true);
    expect(and(ctx, true, false)).toBe(false);
    expect(and(ctx)).toBe(true);
    expect(or(ctx, false, 0, "")).toBe(false);
    expect(or(ctx, false, "x")).toBe(true);
    expect(or(ctx)).toBe(false);
    expect(not(ctx, true)).toBe(false);
    expect(not(ctx, "")).toBe(true);
  });
});

describe("a2ui expressions — action", () => {
  it("openUrl no-ops when window is absent", () => {
    const w = globalThis.window;
    // @ts-expect-error simulate non-browser
    delete globalThis.window;
    expect(() => openUrl(ctx, "https://example.com")).not.toThrow();
    globalThis.window = w;
  });

  it("openUrl calls window.open when present", () => {
    const calls: any[] = [];
    const originalOpen = globalThis.window?.open;
    if (typeof globalThis.window === "undefined") {
      (globalThis as any).window = {};
    }
    (globalThis.window as any).open = (...args: any[]) => calls.push(args);

    openUrl(ctx, "https://example.com", "_self");
    expect(calls).toHaveLength(1);
    expect(calls[0][0]).toBe("https://example.com");
    expect(calls[0][1]).toBe("_self");

    if (originalOpen) (globalThis.window as any).open = originalOpen;
  });
});
