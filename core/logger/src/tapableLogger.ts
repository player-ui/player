import { SyncHook } from 'tapable';
import type { Logger, Severity } from './types';

/** A logger that has a tapable subscriptions to callbacks */
export default class TapableLogger implements Logger {
  public readonly hooks = {
    trace: new SyncHook<Array<any>>(['args']),
    debug: new SyncHook<Array<any>>(['args']),
    info: new SyncHook<Array<any>>(['args']),
    warn: new SyncHook<Array<any>>(['args']),
    error: new SyncHook<Array<any>>(['args']),
    log: new SyncHook<Severity, Array<any>>(['severity', 'args']),
  };

  private logHandlers: Set<Logger> = new Set();

  private createHandler(severity: Severity): (...args: any[]) => void {
    return (...args: any[]) => {
      this.hooks[severity].call(args);
      this.hooks.log.call(severity, args);
      this.logHandlers.forEach((logger) => logger[severity](...args));
    };
  }

  public addHandler(logHandler: Logger) {
    this.logHandlers.add(logHandler);
  }

  public removeHandler(logHandler: Logger) {
    this.logHandlers.delete(logHandler);
  }

  public readonly trace = this.createHandler('trace');
  public readonly debug = this.createHandler('debug');
  public readonly info = this.createHandler('info');
  public readonly warn = this.createHandler('warn');
  public readonly error = this.createHandler('error');
}
