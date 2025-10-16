import type { Logger } from "./types";

/** An empty function so the logger ignore everything */
const noop = () => {};

/** A logger implementation that goes nowhere */
export class NoopLogger implements Logger {
  public readonly trace = noop;
  public readonly debug = noop;
  public readonly info = noop;
  public readonly warn = noop;
  public readonly error = noop;
}
