import type { Logger, Severity } from "./types";
import { severities } from "./types";

export type ConsoleHandler = Pick<typeof console, "log" | "warn" | "error">;

/** A Logger implementation that uses console */
export class ConsoleLogger implements Logger {
  private severity: Severity;
  private _console: ConsoleHandler;

  constructor(severity: Severity = "warn", _console: ConsoleHandler = console) {
    this.severity = severity;
    this._console = _console;
  }

  public setSeverity(severity: Severity) {
    this.severity = severity;
  }

  private getConsoleFn(severity: Severity) {
    switch (severities.indexOf(severity)) {
      case 0:
      case 1:
      case 2:
        return this._console.log;
      case 3:
        return this._console.warn;
      default:
        return this._console.error;
    }
  }

  private createHandler(severity: Severity): (...args: any[]) => void {
    return (...args: any[]) => {
      const sevIndex = severities.indexOf(severity);
      const sevConf = severities.indexOf(this.severity);

      if (sevIndex >= sevConf) {
        this.getConsoleFn(severity)(`player - ${severity} -`, ...args);
      }
    };
  }

  public readonly trace = this.createHandler("trace");
  public readonly debug = this.createHandler("debug");
  public readonly info = this.createHandler("info");
  public readonly warn = this.createHandler("warn");
  public readonly error = this.createHandler("error");
}
