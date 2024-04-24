import type { Logger, Severity, LoggerProvider } from "./types";

/**
 * The ProxyLogger allows a user to log to another Logger instance that may not exist yet
 */
export default class ProxyLogger implements Logger {
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

  public readonly trace = this.createHandler("trace");
  public readonly debug = this.createHandler("debug");
  public readonly info = this.createHandler("info");
  public readonly warn = this.createHandler("warn");
  public readonly error = this.createHandler("error");
}
