import type { Logger, Severity, LoggerProvider, LogFn } from "./types";

/**
 * The ProxyLogger allows a user to log to another Logger instance that may not exist yet
 */
export class ProxyLogger implements Logger {
  private proxiedLoggerProvider: LoggerProvider;

  constructor(loggerProvider: LoggerProvider) {
    this.proxiedLoggerProvider = loggerProvider;
  }

  private createHandler(severity: Severity): (...args: any[]) => void {
    return (...args: any[]) => {
      const logger = this.proxiedLoggerProvider();
      logger?.[severity](...args);
    };
  }

  public readonly trace: LogFn = this.createHandler("trace");
  public readonly debug: LogFn = this.createHandler("debug");
  public readonly info: LogFn = this.createHandler("info");
  public readonly warn: LogFn = this.createHandler("warn");
  public readonly error: LogFn = this.createHandler("error");
}
