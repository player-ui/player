/**
 * Promise detection that handles various Promise implementations
 * and reduces false positives from objects with coincidental 'then' methods
 */
export function isPromiseLike(value: any): value is Promise<any> {
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

/**
 * Wrapper for Promises that are generated from the `await` function with a unique symbol so we can
 * determine when a promise should be awaited by us (as its returned by await) or a promise thats
 * generated from any async function
 */
export interface Awaitable<T> extends Promise<T> {
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
export function isAwaitable(val: unknown): val is Awaitable<any> {
  return (
    isPromiseLike(val) && (val as Awaitable<any>)[AwaitableSymbol] !== undefined
  );
}

/**
 * Wraps Promise.all in AwaitableResult wrapper to allow internal functions to await internally produced promises
 */
export function collateAwaitable<T extends readonly unknown[] | []>(
  promises: T,
): Awaitable<any> {
  const result = Promise.all(promises) as Promise<any>;
  return makeAwaitable(result);
}

/**
 * Add AwaitableSymbol to base promise and promise returned by then() function
 */
export function makeAwaitable(promise: Promise<any>): Awaitable<any> {
  (promise as Awaitable<any>)[AwaitableSymbol] = AwaitableSymbol;
  (promise as any).awaitableThen = (arg: any) => {
    return makeAwaitable(promise.then(arg));
  };
  return promise as Awaitable<any>;
}
