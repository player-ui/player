import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Store original env
const originalEnv = process.env;

describe("Config", () => {
  // Dynamic import to allow resetting modules between tests
  let loadConfig: any;
  let getConfig: any;
  let resetConfig: any;

  beforeEach(async () => {
    // Reset modules to get fresh config instance
    vi.resetModules();
    // Reset environment
    process.env = { ...originalEnv };

    // Import config functions
    const config = await import("../../src/config.js");
    loadConfig = config.loadConfig;
    getConfig = config.getConfig;
    resetConfig = config.resetConfig;

    // Clear any existing config
    resetConfig();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetConfig();
  });

  describe("loadConfig()", () => {
    describe("Default Values", () => {
      it("should return default config when no env vars set", () => {
        const config = loadConfig();

        expect(config.maxDependencyDepth).toBe(2);
        expect(config.overviewMaxLength).toBe(300);
        expect(config.cacheMaxSize).toBe(50);
        expect(config.enablePerformanceLogging).toBe(false);
      });
    });

    describe("Environment Variable Parsing", () => {
      it("should parse MCP_MAX_DEPTH from env", () => {
        process.env.MCP_MAX_DEPTH = "5";
        const config = loadConfig();
        expect(config.maxDependencyDepth).toBe(5);
      });

      it("should parse MCP_OVERVIEW_LENGTH from env", () => {
        process.env.MCP_OVERVIEW_LENGTH = "500";
        const config = loadConfig();
        expect(config.overviewMaxLength).toBe(500);
      });

      it("should parse MCP_CACHE_MAX_SIZE from env", () => {
        process.env.MCP_CACHE_MAX_SIZE = "100";
        const config = loadConfig();
        expect(config.cacheMaxSize).toBe(100);
      });

      it("should parse MCP_ENABLE_PERF_LOG from env", () => {
        process.env.MCP_ENABLE_PERF_LOG = "true";
        const config = loadConfig();
        expect(config.enablePerformanceLogging).toBe(true);
      });

      it("should handle mixed env vars and defaults", () => {
        process.env.MCP_MAX_DEPTH = "3";
        process.env.MCP_ENABLE_PERF_LOG = "true";
        // Other vars use defaults

        const config = loadConfig();

        expect(config.maxDependencyDepth).toBe(3);
        expect(config.overviewMaxLength).toBe(300); // default
        expect(config.cacheMaxSize).toBe(50); // default
        expect(config.enablePerformanceLogging).toBe(true);
      });
    });

    describe("Invalid Environment Variables", () => {
      it("should handle non-numeric MCP_MAX_DEPTH", () => {
        process.env.MCP_MAX_DEPTH = "not-a-number";
        const config = loadConfig();
        // parseInt returns NaN for invalid input
        expect(config.maxDependencyDepth).toBeNaN();
      });

      it("should handle negative numbers", () => {
        process.env.MCP_MAX_DEPTH = "-5";
        const config = loadConfig();
        expect(config.maxDependencyDepth).toBe(-5);
      });

      it("should handle empty string env vars", () => {
        process.env.MCP_MAX_DEPTH = "";
        const config = loadConfig();
        // Empty string is falsy, so "" || "2" evaluates to "2"
        // parseInt("2", 10) returns 2 (falls back to default)
        expect(config.maxDependencyDepth).toBe(2);
      });

      it("should handle non-true boolean values as false", () => {
        process.env.MCP_ENABLE_PERF_LOG = "false";
        const config = loadConfig();
        expect(config.enablePerformanceLogging).toBe(false);

        process.env.MCP_ENABLE_PERF_LOG = "1";
        const config2 = loadConfig();
        expect(config2.enablePerformanceLogging).toBe(false); // Only "true" is truthy

        process.env.MCP_ENABLE_PERF_LOG = "TRUE";
        const config3 = loadConfig();
        expect(config3.enablePerformanceLogging).toBe(false); // Case sensitive
      });
    });

    describe("Edge Cases", () => {
      it("should handle very large numbers", () => {
        process.env.MCP_MAX_DEPTH = "999999";
        const config = loadConfig();
        expect(config.maxDependencyDepth).toBe(999999);
      });

      it("should handle zero values", () => {
        process.env.MCP_MAX_DEPTH = "0";
        process.env.MCP_CACHE_MAX_SIZE = "0";
        const config = loadConfig();
        expect(config.maxDependencyDepth).toBe(0);
        expect(config.cacheMaxSize).toBe(0);
      });

      it("should handle floating point numbers (truncated by parseInt)", () => {
        process.env.MCP_MAX_DEPTH = "3.7";
        const config = loadConfig();
        expect(config.maxDependencyDepth).toBe(3); // parseInt truncates
      });
    });
  });

  describe("getConfig()", () => {
    it("should return config instance", () => {
      const config = getConfig();
      expect(config).toBeDefined();
      expect(config.maxDependencyDepth).toBeDefined();
    });

    it("should return same instance on multiple calls (singleton)", () => {
      const config1 = getConfig();
      const config2 = getConfig();

      expect(config1).toBe(config2); // Same object reference
    });

    it("should cache config after first call", () => {
      // First call
      const config1 = getConfig();
      expect(config1.maxDependencyDepth).toBe(2);

      // Change env (should not affect already-loaded config)
      process.env.MCP_MAX_DEPTH = "10";

      // Second call (should return cached config)
      const config2 = getConfig();
      expect(config2.maxDependencyDepth).toBe(2); // Still 2, not 10
    });

    it("should respect environment variables on first call", () => {
      process.env.MCP_MAX_DEPTH = "7";
      const config = getConfig();
      expect(config.maxDependencyDepth).toBe(7);
    });
  });

  describe("resetConfig()", () => {
    it("should clear cached config", async () => {
      // Load config
      const config1 = getConfig();
      expect(config1.maxDependencyDepth).toBe(2);

      // Reset
      resetConfig();

      // Need to re-import to get fresh module state
      vi.resetModules();
      const freshConfig = await import("../../src/config.js");

      // Change env
      process.env.MCP_MAX_DEPTH = "10";

      // Load again (should reload from env)
      const config2 = freshConfig.getConfig();
      expect(config2.maxDependencyDepth).toBe(10);
    });

    it("should allow multiple resets", () => {
      getConfig();
      resetConfig();
      resetConfig();
      resetConfig();

      const config = getConfig();
      expect(config).toBeDefined();
    });

    it("should not throw when called before any getConfig()", () => {
      expect(() => resetConfig()).not.toThrow();
    });
  });

  describe("Integration Tests", () => {
    it("should support full lifecycle: load, get, reset, reload", async () => {
      // Initial state
      process.env.MCP_MAX_DEPTH = "3";
      const config1 = loadConfig();
      expect(config1.maxDependencyDepth).toBe(3);

      // Get cached
      const config2 = getConfig();
      expect(config2.maxDependencyDepth).toBe(3);

      // Reset and change env
      resetConfig();
      vi.resetModules();
      const freshConfig = await import("../../src/config.js");
      process.env.MCP_MAX_DEPTH = "5";

      // Reload
      const config3 = freshConfig.getConfig();
      expect(config3.maxDependencyDepth).toBe(5);
    });

    it("should be usable across modules (singleton pattern)", () => {
      // Module A loads config
      process.env.MCP_ENABLE_PERF_LOG = "true";
      const configA = getConfig();

      // Module B gets same config
      const configB = getConfig();

      expect(configA).toBe(configB);
      expect(configB.enablePerformanceLogging).toBe(true);
    });
  });

  describe("Type Safety", () => {
    it("should return correctly typed config object", () => {
      const config = loadConfig();

      expect(typeof config.maxDependencyDepth).toBe("number");
      expect(typeof config.overviewMaxLength).toBe("number");
      expect(typeof config.cacheMaxSize).toBe("number");
      expect(typeof config.enablePerformanceLogging).toBe("boolean");
    });
  });
});
