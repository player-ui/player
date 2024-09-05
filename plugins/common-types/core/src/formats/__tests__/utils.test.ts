import { describe, it, expect } from "vitest";
import { removeFormatCharactersFromMaskedString, PLACEHOLDER } from "../utils";

describe("removeFormatCharactersFromMaskedString", () => {
  it("removes formatted characters correctly", () => {
    const result = removeFormatCharactersFromMaskedString(
      "123-456_789",
      "###-###_###",
    );
    expect(result).toBe("123456789");
  });

  it("removes formatted characters with multiple reserved keys", () => {
    const result = removeFormatCharactersFromMaskedString(
      "123-456",
      "###-$$$",
      [PLACEHOLDER, "$"],
    );
    expect(result).toBe("123456");
  });

  it(`doesn't remove characters when value doesn't align with mask`, () => {
    const result = removeFormatCharactersFromMaskedString("123456", "###-###");
    expect(result).toBe("123456");
  });

  it(`doesn't add characters that extend beyond the length of the mask`, () => {
    expect(removeFormatCharactersFromMaskedString("123456", "#####")).toBe(
      "12345",
    );
    expect(
      removeFormatCharactersFromMaskedString("123456", "#$#-##", [
        PLACEHOLDER,
        "$",
      ]),
    ).toBe("12345");
  });

  it(`doesn't add characters beyond possible characters that can be replaced`, () => {
    expect(removeFormatCharactersFromMaskedString("123456", "###-##")).toBe(
      "12345",
    );
  });
});
