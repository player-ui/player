import { describe, it, expect, vitest, beforeEach } from "vitest";
import { ConsoleLogger } from "..";
import type { ConsoleHandler } from "../consoleLogger";

describe("console logger", () => {
  let consoleFns: ConsoleHandler;

  beforeEach(() => {
    consoleFns = {
      log: vitest.fn(),
      warn: vitest.fn(),
      error: vitest.fn(),
    };
  });

  it("calls console fns", () => {
    const logger = new ConsoleLogger("warn", consoleFns);
    logger.warn("test warning");

    expect(consoleFns.warn).toBeCalledTimes(1);
    expect(consoleFns.warn).toBeCalledWith("player - warn -", "test warning");
  });

  it("handles severity", () => {
    const logger = new ConsoleLogger("warn", consoleFns);
    logger.warn("test warning");
    expect(consoleFns.warn).toBeCalledTimes(1);

    logger.info("test info");
    expect(consoleFns.log).toBeCalledTimes(0);

    logger.setSeverity("info");
    logger.info("test info");
    expect(consoleFns.log).toBeCalledTimes(1);
    expect(consoleFns.log).toBeCalledWith("player - info -", "test info");

    logger.setSeverity("trace");
    logger.debug("test debug");
    expect(consoleFns.log).toBeCalledTimes(2);
    expect(consoleFns.log).toBeCalledWith("player - debug -", "test debug");

    logger.error("errrr");
    expect(consoleFns.error).toBeCalledTimes(1);
    expect(consoleFns.error).toBeCalledWith("player - error -", "errrr");
  });
});
