import { describe, it, expect } from "vitest";
import { isErrorWithMetadata } from "../isErrorWithMetadata";
import { ErrorSeverity } from "../../types";

/** Test class to create an error with any additional properties */
class ErrorWithProps extends Error implements Record<PropertyKey, unknown> {
  [key: PropertyKey]: unknown;
}

const createTestError = (
  additionalProps?: Record<PropertyKey, unknown>,
): ErrorWithProps => {
  const err: ErrorWithProps = new ErrorWithProps("Message");
  if (additionalProps) {
    for (const [key, val] of Object.entries(additionalProps)) {
      err[key] = val;
    }
  }

  return err;
};

describe("isErrorWithMetadata", () => {
  const correctCases = [
    createTestError({ type: "type" }),
    createTestError({ type: "type", metadata: {} }),
    createTestError({ type: "type", severity: ErrorSeverity.ERROR }),
    createTestError({
      type: "type",
      metadata: {},
      severity: ErrorSeverity.ERROR,
    }),
    createTestError({
      type: "type",
      metadata: {},
      severity: ErrorSeverity.ERROR,
      someUnknownProperty: "more data should not impact test case.",
    }),
  ];
  it.each(correctCases)(
    "should return true if type is present and all properties match their expected types.",
    (err) => {
      expect(isErrorWithMetadata(err)).toBe(true);
    },
  );

  const badTypeCases = [
    // `type` must be defined
    createTestError({
      metadata: {},
      severity: ErrorSeverity.ERROR,
    }),
    // `type` must be a string
    createTestError({
      type: 100,
      metadata: {},
      severity: ErrorSeverity.ERROR,
    }),
  ];
  it.each(badTypeCases)(
    "should return false if type is not present or not a string",
    (err) => {
      expect(isErrorWithMetadata(err)).toBe(false);
    },
  );

  const badSeverityCases = [
    // `severity` must be a string
    createTestError({
      type: "type",
      metadata: {},
      severity: 100,
    }),
    // `severity` must be an option in the `ErrorSeverity` enum
    createTestError({
      type: "type",
      metadata: {},
      severity: "NotARealErrorSeverity",
    }),
  ];
  it.each(badSeverityCases)(
    "should return false if severity is not a value from the ErrorSeverity enum",
    (err) => {
      expect(isErrorWithMetadata(err)).toBe(false);
    },
  );

  const badMetadataCases = [
    // `metadata` must be an object
    createTestError({
      type: "type",
      metadata: 100,
      severity: ErrorSeverity.ERROR,
    }),
    // `metadata` cannot be an array
    createTestError({
      type: "type",
      metadata: [],
      severity: ErrorSeverity.ERROR,
    }),
    // `metadata` cannot be null
    createTestError({
      type: "type",
      metadata: null,
      severity: ErrorSeverity.ERROR,
    }),
  ];
  it.each(badMetadataCases)(
    "should return false if meatadata is not an object",
    (err) => {
      expect(isErrorWithMetadata(err)).toBe(false);
    },
  );
});
