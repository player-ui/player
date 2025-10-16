import { test, expect, vitest } from "vitest";
import type { Logger } from "../types";
import { ProxyLogger } from "../proxyLogger";

test("proxyLogger works with no logger", () => {
  const proxyLogger = new ProxyLogger(() => undefined);
  expect(() => proxyLogger.info("foo")).not.toThrow();
});

test("calls real logger when set", () => {
  const testLogger: Logger = {
    trace: vitest.fn(),
    debug: vitest.fn(),
    info: vitest.fn(),
    warn: vitest.fn(),
    error: vitest.fn(),
  };

  let useTestLogger = false;

  const proxyLogger = new ProxyLogger(() =>
    useTestLogger ? testLogger : undefined,
  );

  proxyLogger.error("err");
  expect(testLogger.error).toBeCalledTimes(0);

  useTestLogger = true;
  proxyLogger.error("err");
  expect(testLogger.error).toBeCalledTimes(1);
});
