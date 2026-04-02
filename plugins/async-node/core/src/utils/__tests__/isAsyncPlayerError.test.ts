import { describe, it, expect } from "vitest";
import { isAsyncPlayerError } from "../isAsyncPlayerError";

describe("isAsyncPlayerError", () => {
  it("should return true for errors with the type 'ASYNC-PLUGIN'", () => {
    expect(
      isAsyncPlayerError({
        error: new Error("test"),
        errorType: "ASYNC-PLUGIN",
        skipped: false,
      }),
    ).toBe(true);
  });

  it("should return false for errors without the type 'ASYNC-PLUGIN'", () => {
    expect(
      isAsyncPlayerError({
        error: new Error("test"),
        errorType: "UNKNOWN",
        skipped: false,
      }),
    ).toBe(false);
  });
});
