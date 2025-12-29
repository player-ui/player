import { SyncHook } from "tapable-ts";
import type { LogFn, Logger, Severity } from "./types";

/** A logger that has a tapable subscriptions to callbacks */
export class TapableLogger implements Logger {
  public readonly hooks: {
    trace: SyncHook<[any[]], Record<string, any>>;
    debug: SyncHook<[any[]], Record<string, any>>;
    info: SyncHook<[any[]], Record<string, any>>;
    warn: SyncHook<[any[]], Record<string, any>>;
    error: SyncHook<[any[]], Record<string, any>>;
    log: SyncHook<[Severity, any[]], Record<string, any>>;
  } = {
    trace: new SyncHook(),
    debug: new SyncHook(),
    info: new SyncHook(),
    warn: new SyncHook(),
    error: new SyncHook(),
    log: new SyncHook(),
  };

  private logHandlers: Set<Logger> = new Set();

  private createHandler(severity: Severity): (...args: any[]) => void {
    return (...args: any[]) => {
      this.hooks[severity].call(args);
      this.hooks.log.call(severity, args);
      this.logHandlers.forEach((logger) => logger[severity](...args));
    };
  }

  public addHandler(logHandler: Logger): void {
    this.logHandlers.add(logHandler);
  }

  public removeHandler(logHandler: Logger): void {
    this.logHandlers.delete(logHandler);
  }

  public readonly trace: LogFn = this.createHandler("trace");
  public readonly debug: LogFn = this.createHandler("debug");
  public readonly info: LogFn = this.createHandler("info");
  public readonly warn: LogFn = this.createHandler("warn");
  public readonly error: LogFn = this.createHandler("error");
}
