/**
 * Structured logging for MCP server
 * Logs to stderr to avoid interfering with MCP protocol on stdout
 */

export type LogLevel = "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogContext {
  [key: string]: unknown;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

class Logger {
  private logLevel: LogLevel;
  private enabledLevels: Set<LogLevel>;

  constructor() {
    // Map environment variable to log level
    const envLevel = (process.env.MCP_LOG_LEVEL || "INFO").toUpperCase();
    this.logLevel = this.isValidLogLevel(envLevel) ? envLevel : "INFO";

    // Determine which levels are enabled based on current log level
    this.enabledLevels = this.getEnabledLevels(this.logLevel);
  }

  private isValidLogLevel(level: string): level is LogLevel {
    return ["DEBUG", "INFO", "WARN", "ERROR"].includes(level);
  }

  private getEnabledLevels(level: LogLevel): Set<LogLevel> {
    const levels: LogLevel[] = ["DEBUG", "INFO", "WARN", "ERROR"];
    const startIndex = levels.indexOf(level);
    return new Set(levels.slice(startIndex));
  }

  private shouldLog(level: LogLevel): boolean {
    return this.enabledLevels.has(level);
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(context && { context }),
    };
    return JSON.stringify(entry);
  }

  private writeLog(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logLine = this.formatLogEntry(level, message, context);
    // Always write to stderr to avoid interfering with MCP protocol on stdout
    console.error(logLine);
  }

  debug(message: string, context?: LogContext): void {
    this.writeLog("DEBUG", message, context);
  }

  info(message: string, context?: LogContext): void {
    this.writeLog("INFO", message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.writeLog("WARN", message, context);
  }

  error(message: string, context?: LogContext): void {
    this.writeLog("ERROR", message, context);
  }

  /**
   * Measure and log execution time for an operation
   */
  async measure<T>(operation: string, fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      this.debug(`${operation} completed`, { duration });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.error(`${operation} failed`, {
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }
}

// Singleton logger instance
let loggerInstance: Logger | null = null;

/**
 * Get the logger instance
 */
export function getLogger(): Logger {
  if (!loggerInstance) {
    loggerInstance = new Logger();
  }
  return loggerInstance;
}

/**
 * Reset logger (mainly for testing)
 */
export function resetLogger(): void {
  loggerInstance = null;
}
