import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Store original env
const originalEnv = process.env;

describe("Logger", () => {
  // Dynamic import to allow resetting modules between tests
  let getLogger: any;
  let resetLogger: any;

  // Spy for console.error
  let consoleErrorSpy: any;

  beforeEach(async () => {
    // Reset modules to get fresh logger instance
    vi.resetModules();
    // Reset environment
    process.env = { ...originalEnv };

    // Setup console.error spy
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Import logger functions
    const logger = await import("../../src/logger.js");
    getLogger = logger.getLogger;
    resetLogger = logger.resetLogger;

    // Clear any existing logger
    resetLogger();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleErrorSpy.mockRestore();
    resetLogger();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("Log Level Filtering", () => {
    it("should default to INFO level when no env var set", () => {
      delete process.env.MCP_LOG_LEVEL;
      const logger = getLogger();

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      // DEBUG should be filtered out, INFO/WARN/ERROR should log
      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
    });

    it("should respect MCP_LOG_LEVEL=DEBUG", () => {
      process.env.MCP_LOG_LEVEL = "DEBUG";
      const logger = getLogger();

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      // All levels should log
      expect(consoleErrorSpy).toHaveBeenCalledTimes(4);
    });

    it("should respect MCP_LOG_LEVEL=INFO", () => {
      process.env.MCP_LOG_LEVEL = "INFO";
      const logger = getLogger();

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      // DEBUG filtered, INFO/WARN/ERROR log
      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
    });

    it("should respect MCP_LOG_LEVEL=WARN", () => {
      process.env.MCP_LOG_LEVEL = "WARN";
      const logger = getLogger();

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      // DEBUG/INFO filtered, WARN/ERROR log
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });

    it("should respect MCP_LOG_LEVEL=ERROR", () => {
      process.env.MCP_LOG_LEVEL = "ERROR";
      const logger = getLogger();

      logger.debug("debug message");
      logger.info("info message");
      logger.warn("warn message");
      logger.error("error message");

      // Only ERROR logs
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it("should handle lowercase log level env var", () => {
      process.env.MCP_LOG_LEVEL = "debug";
      const logger = getLogger();

      logger.debug("debug message");

      // Should be converted to uppercase and work
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it("should fallback to INFO for invalid log level", () => {
      process.env.MCP_LOG_LEVEL = "INVALID";
      const logger = getLogger();

      logger.debug("debug message");
      logger.info("info message");

      // Should default to INFO behavior (DEBUG filtered, INFO logs)
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it("should filter logs below threshold correctly", () => {
      process.env.MCP_LOG_LEVEL = "WARN";
      const logger = getLogger();

      logger.debug("should not appear");
      logger.info("should not appear");

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe("Structured Logging Format", () => {
    it("should format logs as valid JSON", () => {
      const logger = getLogger();
      logger.info("test message");

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      expect(() => JSON.parse(logOutput)).not.toThrow();
    });

    it("should include timestamp, level, and message", () => {
      const logger = getLogger();
      logger.info("test message");

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed).toHaveProperty("timestamp");
      expect(parsed).toHaveProperty("level");
      expect(parsed).toHaveProperty("message");
      expect(parsed.level).toBe("INFO");
      expect(parsed.message).toBe("test message");
    });

    it("should include context when provided", () => {
      const logger = getLogger();
      const context = { userId: "123", action: "login" };
      logger.info("user action", context);

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed).toHaveProperty("context");
      expect(parsed.context).toEqual(context);
    });

    it("should not include context field when not provided", () => {
      const logger = getLogger();
      logger.info("test message");

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed).not.toHaveProperty("context");
    });

    it("should write to stderr (console.error)", () => {
      const logger = getLogger();
      logger.info("test message");

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain("test message");
    });

    it("should format timestamp as ISO 8601", () => {
      const logger = getLogger();
      logger.info("test message");

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      // Verify timestamp is valid ISO 8601
      expect(new Date(parsed.timestamp).toISOString()).toBe(parsed.timestamp);
    });

    it("should handle complex context objects", () => {
      const logger = getLogger();
      const context = {
        nested: { value: 123 },
        array: [1, 2, 3],
        string: "test",
        number: 42,
        boolean: true,
        null: null,
      };
      logger.info("complex context", context);

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.context).toEqual(context);
    });
  });

  describe("Log Methods", () => {
    it("should log debug messages with DEBUG level", () => {
      process.env.MCP_LOG_LEVEL = "DEBUG";
      const logger = getLogger();
      logger.debug("debug message");

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe("DEBUG");
      expect(parsed.message).toBe("debug message");
    });

    it("should log info messages with INFO level", () => {
      const logger = getLogger();
      logger.info("info message");

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe("INFO");
      expect(parsed.message).toBe("info message");
    });

    it("should log warn messages with WARN level", () => {
      const logger = getLogger();
      logger.warn("warn message");

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe("WARN");
      expect(parsed.message).toBe("warn message");
    });

    it("should log error messages with ERROR level", () => {
      const logger = getLogger();
      logger.error("error message");

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe("ERROR");
      expect(parsed.message).toBe("error message");
    });
  });

  describe("measure() Method", () => {
    it("should measure successful operations", async () => {
      process.env.MCP_LOG_LEVEL = "DEBUG";
      const logger = getLogger();

      const result = await logger.measure("test operation", async () => {
        return "success";
      });

      expect(result).toBe("success");
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe("DEBUG");
      expect(parsed.message).toBe("test operation completed");
      expect(parsed.context).toHaveProperty("duration");
      expect(typeof parsed.context.duration).toBe("number");
      expect(parsed.context.duration).toBeGreaterThanOrEqual(0);
    });

    it("should measure failed operations and rethrow", async () => {
      process.env.MCP_LOG_LEVEL = "DEBUG";
      const logger = getLogger();
      const error = new Error("operation failed");

      await expect(
        logger.measure("test operation", async () => {
          throw error;
        }),
      ).rejects.toThrow("operation failed");

      // Should have logged error
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.level).toBe("ERROR");
      expect(parsed.message).toBe("test operation failed");
      expect(parsed.context).toHaveProperty("duration");
      expect(parsed.context).toHaveProperty("error");
      expect(parsed.context.error).toBe("operation failed");
    });

    it("should log duration for successful operations", async () => {
      process.env.MCP_LOG_LEVEL = "DEBUG";
      const logger = getLogger();

      vi.useFakeTimers();
      const measurePromise = logger.measure("test", async () => {
        vi.advanceTimersByTime(100);
        return "done";
      });

      vi.runAllTimers();
      await measurePromise;

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.context.duration).toBeGreaterThanOrEqual(0);
    });

    it("should log duration for failed operations", async () => {
      const logger = getLogger();

      vi.useFakeTimers();
      const measurePromise = logger.measure("test", async () => {
        vi.advanceTimersByTime(50);
        throw new Error("fail");
      });

      vi.runAllTimers();
      await expect(measurePromise).rejects.toThrow("fail");

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.context.duration).toBeGreaterThanOrEqual(0);
    });

    it("should handle non-Error exceptions", async () => {
      const logger = getLogger();

      await expect(
        logger.measure("test", async () => {
          throw "string error";
        }),
      ).rejects.toBe("string error");

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      const parsed = JSON.parse(logOutput);

      expect(parsed.context.error).toBe("string error");
    });

    it("should return the correct result from measured operation", async () => {
      process.env.MCP_LOG_LEVEL = "DEBUG";
      const logger = getLogger();
      const expectedResult = { data: [1, 2, 3], status: "ok" };

      const result = await logger.measure("test", async () => expectedResult);

      expect(result).toEqual(expectedResult);
    });

    it("should measure async operations correctly", async () => {
      process.env.MCP_LOG_LEVEL = "DEBUG";
      const logger = getLogger();

      const result = await logger.measure("async test", async () => {
        return new Promise((resolve) => {
          setTimeout(() => resolve("async result"), 10);
        });
      });

      expect(result).toBe("async result");
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Singleton Behavior", () => {
    it("should return same instance on multiple calls", () => {
      const logger1 = getLogger();
      const logger2 = getLogger();

      expect(logger1).toBe(logger2);
    });

    it("should maintain state across calls", () => {
      process.env.MCP_LOG_LEVEL = "ERROR";
      const logger1 = getLogger();

      // First logger configured with ERROR level
      logger1.debug("test");
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      // Second call should have same configuration
      const logger2 = getLogger();
      logger2.debug("test");
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      // Both should log errors
      logger1.error("error1");
      logger2.error("error2");
      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);
    });

    it("should respect resetLogger() for testing", async () => {
      process.env.MCP_LOG_LEVEL = "ERROR";
      const logger1 = getLogger();

      logger1.info("test");
      expect(consoleErrorSpy).not.toHaveBeenCalled();

      // Reset logger
      resetLogger();

      // Re-import to get fresh module
      vi.resetModules();
      const freshLogger = await import("../../src/logger.js");

      // Change env and get new logger
      process.env.MCP_LOG_LEVEL = "INFO";
      const logger2 = freshLogger.getLogger();

      logger2.info("test");
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });

    it("should allow multiple resets", () => {
      getLogger();
      resetLogger();
      resetLogger();
      resetLogger();

      const logger = getLogger();
      expect(logger).toBeDefined();
    });

    it("should not throw when resetLogger called before getLogger", () => {
      expect(() => resetLogger()).not.toThrow();
    });
  });

  describe("Log Level Hierarchy", () => {
    it("ERROR level should log only ERROR", () => {
      process.env.MCP_LOG_LEVEL = "ERROR";
      const logger = getLogger();

      logger.debug("debug");
      logger.info("info");
      logger.warn("warn");
      logger.error("error");

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(parsed.level).toBe("ERROR");
    });

    it("WARN level should log WARN and ERROR", () => {
      process.env.MCP_LOG_LEVEL = "WARN";
      const logger = getLogger();

      logger.debug("debug");
      logger.info("info");
      logger.warn("warn");
      logger.error("error");

      expect(consoleErrorSpy).toHaveBeenCalledTimes(2);

      const levels = consoleErrorSpy.mock.calls.map((call: any) => {
        return JSON.parse(call[0]).level;
      });
      expect(levels).toEqual(["WARN", "ERROR"]);
    });

    it("INFO level should log INFO, WARN, ERROR", () => {
      process.env.MCP_LOG_LEVEL = "INFO";
      const logger = getLogger();

      logger.debug("debug");
      logger.info("info");
      logger.warn("warn");
      logger.error("error");

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);

      const levels = consoleErrorSpy.mock.calls.map((call: any) => {
        return JSON.parse(call[0]).level;
      });
      expect(levels).toEqual(["INFO", "WARN", "ERROR"]);
    });

    it("DEBUG level should log all levels", () => {
      process.env.MCP_LOG_LEVEL = "DEBUG";
      const logger = getLogger();

      logger.debug("debug");
      logger.info("info");
      logger.warn("warn");
      logger.error("error");

      expect(consoleErrorSpy).toHaveBeenCalledTimes(4);

      const levels = consoleErrorSpy.mock.calls.map((call: any) => {
        return JSON.parse(call[0]).level;
      });
      expect(levels).toEqual(["DEBUG", "INFO", "WARN", "ERROR"]);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty messages", () => {
      const logger = getLogger();
      logger.info("");

      const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(parsed.message).toBe("");
    });

    it("should handle very long messages", () => {
      const logger = getLogger();
      const longMessage = "x".repeat(10000);
      logger.info(longMessage);

      const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(parsed.message).toBe(longMessage);
    });

    it("should handle special characters in messages", () => {
      const logger = getLogger();
      const message = 'Special chars: \n\t\r"\\';
      logger.info(message);

      const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(parsed.message).toBe(message);
    });

    it("should handle empty context objects", () => {
      const logger = getLogger();
      logger.info("test", {});

      const parsed = JSON.parse(consoleErrorSpy.mock.calls[0][0]);
      expect(parsed.context).toEqual({});
    });

    it("should handle context with undefined values", () => {
      const logger = getLogger();
      logger.info("test", { key: undefined });

      const logOutput = consoleErrorSpy.mock.calls[0][0];
      expect(() => JSON.parse(logOutput)).not.toThrow();
    });
  });
});
