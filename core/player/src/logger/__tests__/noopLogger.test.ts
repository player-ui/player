import { test, expect } from "vitest";
import { NoopLogger, severities } from "..";
import type { LogFn } from "../types";

test("does nothing - like it should", () => {
  const logger = new NoopLogger();

  severities.forEach((s) => {
    (logger[s] as LogFn)("foo");
  });

  expect(true).toBe(true);
});
