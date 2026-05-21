export type ContextKey<Value = unknown> = {
  readonly symbol: symbol;
  readonly description: string;
  /** Phantom marker so TS can infer `Value` from a key. Not present at runtime. */
  readonly __value?: Value;
};

export type ContextReader = <Value>(
  key: ContextKey<Value>,
) => Value | undefined;

export type ContextTransform<Value> = {
  /** Source keys whose updates should invalidate (and notify subscribers of) this target. */
  sources: ReadonlyArray<ContextKey>;
  /** Compute the target value, reading from other context entries. */
  compute: (read: ContextReader) => Value | undefined;
};

export type ContextSubscriber<Value> = (
  value: Value | undefined,
  key: ContextKey<Value>,
) => void;

export type ContextGlobalSubscriber = (value: unknown, key: ContextKey) => void;

export type ContextEntryDescriptor = {
  symbol: symbol;
  description: string;
  hasValue: boolean;
  hasTransform: boolean;
};

export type SubscriptionToken = `ctx_${number}`;

export type FrozenContextEntry = {
  readonly symbol: symbol;
  readonly description: string;
  readonly value: unknown;
};

export type FrozenContextSnapshot = {
  readonly flowId?: string;
  readonly endedAt: number;
  readonly entries: ReadonlyArray<FrozenContextEntry>;
};
