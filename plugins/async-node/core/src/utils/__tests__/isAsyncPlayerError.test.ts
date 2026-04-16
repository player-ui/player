import { describe, it, expect } from "vitest";
import { isAsyncPlayerError } from "../isAsyncPlayerError";
import {
  ErrorMetadata,
  ErrorSeverity,
  PlayerErrorMetadata,
} from "@player-ui/player";

/** Test class to create an error with any additional properties */
class ErrorWithProps extends Error implements PlayerErrorMetadata {
  constructor(
    message: string,
    public type: string,
    public severity?: ErrorSeverity,
    public metadata?: ErrorMetadata,
  ) {
    super(message);
  }
}

describe("isAsyncPlayerError", () => {
  it("should return true for errors with the type 'ASYNC-PLUGIN'", () => {
    expect(isAsyncPlayerError(new ErrorWithProps("test", "ASYNC-PLUGIN"))).toBe(
      true,
    );
  });

  it("should return false for errors without the type 'ASYNC-PLUGIN'", () => {
    expect(isAsyncPlayerError(new ErrorWithProps("test", "UNKNOWN"))).toBe(
      false,
    );
  });
});
