export type LogFn = (...args: Array<any>) => void;

export const severities = ['trace', 'debug', 'info', 'warn', 'error'] as const;
export type Severity = (typeof severities)[number];
export type Logger = Record<Severity, LogFn>;
export type LoggerProvider = () => Logger | undefined;
