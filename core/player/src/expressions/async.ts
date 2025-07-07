/**
 * Promise detection that handles various Promise implementations
 * and reduces false positives from objects with coincidental 'then' methods
 */
export function isPromiselike(value: any): value is Promise<any> {
  return (
    value != null &&
    typeof value === "object" &&
    typeof value.then === "function" &&
    // Additional safeguards against false positives
    (value instanceof Promise ||
      // Check for standard Promise constructor name
      value.constructor?.name === "Promise" ||
      // Verify it has other Promise-like methods to reduce false positives
      (typeof value.catch === "function" &&
        typeof value.finally === "function"))
  );
}

/** Unique private symbol to indicate async functions wrapped in Player's await function */
export const AwaitableSymbol: unique symbol = Symbol("Awaitable");

/** Wrapped promise that should be awaited */
export interface AwaitableResult<T> extends Promise<T> {
  /** Prevent unwrapped then from being exposed from underlying promise */
  then: never;
  /** Internalally awaitable wrapper around underlying then function */
  awaitableThen<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null,
  ): Promise<TResult1 | TResult2>;
  /** Symbol to identify this as something returned by await */
  [AwaitableSymbol]: symbol;
}

/** Typeguard for AwaitableResult */
export function isAwaitable(val: unknown): val is AwaitableResult<any> {
  return (
    isPromiselike(val) &&
    (val as AwaitableResult<any>)[AwaitableSymbol] !== undefined
  );
}

/**
 * Wraps Promise.all in AwaitableResult wrapper to allow internal functions to await internally produced promises
 */
export function collateAwaitable<T extends readonly unknown[] | []>(
  promises: T,
): AwaitableResult<any> {
  const result = Promise.all(promises) as Promise<any>;
  return makeAwaitable(result);
}

/**
 * Add AwaitableSymbol to base promise and promise returned by then() function
 */
export function makeAwaitable(promise: Promise<any>): AwaitableResult<any> {
  (promise as AwaitableResult<any>)[AwaitableSymbol] = AwaitableSymbol;
  (promise as any).awaitableThen = (arg: any) => {
    return makeAwaitable(promise.then(arg));
  };
  return promise as AwaitableResult<any>;
}
