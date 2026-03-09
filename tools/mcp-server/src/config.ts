/**
 * Configuration management for MCP server
 * Supports environment variables for runtime configuration
 */

export interface McpConfig {
  /** Maximum depth for dependency loading (default: 2) */
  maxDependencyDepth: number;
  /** Maximum length for overview sections (default: 300) */
  overviewMaxLength: number;
  /** Maximum number of entries in the knowledge cache (default: 50) */
  cacheMaxSize: number;
  /** Enable performance logging to stderr (default: false) */
  enablePerformanceLogging: boolean;
}

/**
 * Load configuration from environment variables with sensible defaults
 */
export function loadConfig(): McpConfig {
  return {
    maxDependencyDepth: parseInt(process.env.MCP_MAX_DEPTH || "2", 10),
    overviewMaxLength: parseInt(process.env.MCP_OVERVIEW_LENGTH || "300", 10),
    cacheMaxSize: parseInt(process.env.MCP_CACHE_MAX_SIZE || "50", 10),
    enablePerformanceLogging: process.env.MCP_ENABLE_PERF_LOG === "true",
  };
}

// Singleton config instance
let configInstance: McpConfig | null = null;

/**
 * Get the current configuration
 * Loads and caches on first access
 */
export function getConfig(): McpConfig {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

/**
 * Reset configuration (mainly for testing)
 */
export function resetConfig(): void {
  configInstance = null;
}
