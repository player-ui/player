import type { LogFn, Logger } from "./types";

/** An empty function so the logger ignore everything */
const noop = (): void => {};

/** A logger implementation that goes nowhere */
export class NoopLogger implements Logger {
  public readonly trace: LogFn = noop;
  public readonly debug: LogFn = noop;
  public readonly info: LogFn = noop;
  public readonly warn: LogFn = noop;
  public readonly error: LogFn = noop;
}
