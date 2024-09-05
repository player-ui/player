/* eslint-disable @typescript-eslint/no-loss-of-precision */
import { describe, it, expect } from "vitest";
import { commaNumber, integer, date, currency, phone } from "..";

describe("integer", () => {
  describe("formatting", () => {
    it("stringifies numbers", () => {
      expect(integer.format?.("45")).toBe("45");
      expect(integer.format?.("4.000")).toBe("4");
      expect(integer.format?.(4.5)).toBe("4");
    });

    it("ignores non-numeric things", () => {
      expect(integer.format?.(undefined as any)).toBe("");
      expect(integer.format?.(null as any)).toBe("");
      expect(integer.format?.("blah")).toBe("");
      expect(integer.format?.("foo33bar")).toBe("33");
      expect(integer.format?.("foo4.00bar")).toBe("4");
    });

    it("leaves the negative sign alone", () => {
      expect(integer.format?.("-")).toBe("-");
      expect(integer.format?.("-0")).toBe("0");
      expect(integer.format?.("-4.0")).toBe("-4");
    });
  });

  describe("deformatting", () => {
    it("always returns +0", () => {
      expect(Object.is(integer.deformat?.(-0), 0)).toBe(true);
      expect(Object.is(integer.deformat?.(+0), 0)).toBe(true);
    });

    it("removes decimal points", () => {
      expect(integer.deformat?.("4.00")).toBe(4);
      expect(integer.deformat?.("-0.000000")).toBe(0);
    });

    it("handles bad values", () => {
      expect(integer.deformat?.(null as any)).toBeUndefined();
      expect(integer.deformat?.(undefined as any)).toBeUndefined();
    });

    it("removes ascii chars", () => {
      expect(integer.deformat?.("333dsfdfsd")).toBe(333);
      expect(integer.deformat?.("blah4.00foo")).toBe(4);
      expect(integer.deformat?.("-")).toBeUndefined();
      expect(integer.deformat?.("4.0.0")).toBe(4);
    });
  });
});

describe("commaNumber", () => {
  describe("formatting", () => {
    it("leaves things alone", () => {
      expect(commaNumber.format?.("")).toBe("");
      expect(commaNumber.format?.(undefined as any)).toBe(undefined);
      expect(commaNumber.format?.({} as any)).toBe("");
    });

    it("adds commas to things", () => {
      expect(commaNumber.format?.(1000)).toBe("1,000");
      expect(commaNumber.format?.(-1000)).toBe("-1,000");
      expect(commaNumber.format?.(1000000000.999)).toBe("1,000,000,000.999");
      expect(commaNumber.format?.(".99")).toBe("0.99");
    });

    it("works with precision", () => {
      expect(commaNumber.format?.(1000.999, { precision: 2 })).toBe("1,000.99");
      expect(commaNumber.format?.(1000, { precision: 2 })).toBe("1,000.00");
      expect(commaNumber.format?.(1000.1, { precision: 2 })).toBe("1,000.10");
      expect(commaNumber.format?.(123456789, { precision: 0 })).toBe(
        "123,456,789",
      );
    });

    it("handles out of bounds", () => {
      expect(commaNumber.format?.(123456789123456789, { precision: 2 })).toBe(
        "1,234,567,891,234,567.00",
      );

      expect(commaNumber.format?.(123456789123456789.0, { precision: 2 })).toBe(
        "1,234,567,891,234,567.00",
      );
    });
  });

  describe("deformatting", () => {
    it("does nothing with null values", () => {
      expect(commaNumber.deformat?.(null as any)).toBe(null);
    });

    it("does nothing with integer values", () => {
      expect(commaNumber.deformat?.(1 as any)).toBe(1);
    });

    it("strips commas from the string", () => {
      expect(commaNumber.deformat?.("111,111")).toBe(111111);
    });

    it("treats non-numbers as undef", () => {
      expect(commaNumber.deformat?.("")).toBe(undefined);
    });

    it("treats out of bound numbers as undef", () => {
      expect(commaNumber.deformat?.("9,999,999,999,999,999.00")).toBe(
        undefined,
      );
      expect(commaNumber.deformat?.("-9,999,999,999,999,999.00")).toBe(
        undefined,
      );
    });
  });
});

describe("date", () => {
  describe("formatting", () => {
    it("leaves things alone", () => {
      expect(date.format?.("")).toBe("");
      expect(date.format?.(undefined as any)).toBe(undefined);
      expect(date.format?.({} as any)).toBe("");
    });

    it("add slashes as long as theyre not trailing", () => {
      expect(date.format?.("11")).toBe("11");
      expect(date.format?.("112")).toBe("11/2");
      expect(date.format?.("1122")).toBe("11/22");
      expect(date.format?.("112233")).toBe("11/22/1933");
      expect(date.format?.("11223333")).toBe("11/22/3333");
    });

    it("doesnt recognize 00 as valid month or day", () => {
      expect(date.format?.("00")).toBe("0");
      expect(date.format?.("00/01")).toBe("00/01");
      expect(date.format?.("05/00")).toBe("05/0");
      expect(date.format?.("05/00/1999")).toBe("05/00/1999");
    });

    it("cuts off after mask is full", () => {
      expect(date.format?.("112233334444")).toBe("11/22/3333");
    });

    it("uses mask option for custom date mask", () => {
      expect(date.format?.("112233334444", { mask: "MM/DD/YY" })).toBe(
        "11/22/33",
      );
    });

    it("converts YYYY-MM-DD to MM/DD/YYYY", () => {
      expect(date.format?.("2021-4-1")).toBe("04/01/2021");
      expect(date.format?.("2021-04-20")).toBe("04/20/2021");
      expect(date.format?.("1111-22-33")).toBe("22/33/1111");
    });

    it("does not attempt to convert - delimited date format other than specifically YYYY-MM-DD", () => {
      expect(date.format?.("2021-")).toBe("20/21");
      expect(date.format?.("202-0")).toBe("20/20");
      expect(date.format?.("2021-0420")).toBe("20/21/0420");
    });
  });
});

describe("currency", () => {
  const currencyOptions = { currencySymbol: "$" };

  describe("formatting", () => {
    it("leaves things alone", () => {
      expect(currency.format?.("")).toBe("");
      expect(currency.format?.(undefined as any)).toBe(undefined);
      expect(currency.format?.(null as any)).toBe(null);
    });

    it("adds commas to things", () => {
      expect(currency.format?.(1000, currencyOptions)).toBe("$1,000.00");
      expect(currency.format?.(-1000, currencyOptions)).toBe("-$1,000.00");

      // Forces precision of 2
      expect(currency.format?.(1000000000.999, currencyOptions)).toBe(
        "$1,000,000,001.00",
      );
    });

    it("optionally uses parens", () => {
      expect(
        currency.format?.(-100, {
          ...currencyOptions,
          useParensForNeg: true,
          precision: 1,
        }),
      ).toBe("($100.0)");
    });

    it("uses custom currency symbols", () => {
      expect(
        currency.format?.(-100100, { currencySymbol: "ADAM", precision: 0 }),
      ).toBe("-ADAM100,100");
    });
  });

  describe("deformatting", () => {
    it("does nothing with integer values", () => {
      expect(currency.deformat?.(1 as any, currencyOptions)).toBe(1);
    });

    it("strips commas from the string", () => {
      expect(currency.deformat?.("111,111", currencyOptions)).toBe(111111);
    });

    it("treats non-numbers as undef", () => {
      expect(currency.deformat?.("", currencyOptions)).toBe(undefined);
    });

    it("strips out currency symbols", () => {
      expect(currency.deformat?.("-$111,111", currencyOptions)).toBe(-111111);
    });
  });
});

describe("phone", () => {
  describe("formatting", () => {
    it("adds formatting when one character entered", () => {
      expect(phone.format?.("1")).toBe("(1");
    });

    it("removes formatting when open paren given", () => {
      expect(phone.format?.("(")).toBe("");
    });

    it("adds formatting when partial number given", () => {
      expect(phone.format?.("123456")).toBe("(123) 456-");
      expect(phone.format?.("12345678")).toBe("(123) 456-78");
    });

    it("fixes formatting when missing prefix digit", () => {
      expect(phone.format?.("(858) 53-6789")).toBe("(858) 536-789");
    });

    it("fixes formatting when missing area code digit", () => {
      expect(phone.format?.("(88) 531-6789")).toBe("(885) 316-789");
    });

    it("preserves formatting when value is well formatted", () => {
      expect(phone.format?.("(123) 123-1231")).toBe("(123) 123-1231");
    });

    it(`doesn't add extra characters beyond mask value`, () => {
      expect(phone.format?.("(123) 123-123145")).toBe("(123) 123-1231");
    });
  });

  describe("deformatting", () => {
    it("removes masking chars", () => {
      expect(phone.deformat?.("(123) 123-1231")).toBe("1231231231");
    });

    it(`doesn't remove characters when deformatting a deformatted value`, () => {
      expect(phone.deformat?.("1231231231")).toBe("1231231231");
    });

    it("ignores improper formatting of the input string", () => {
      expect(phone.deformat?.("123-123-1231")).toBe("1231231231");
    });
  });
});
