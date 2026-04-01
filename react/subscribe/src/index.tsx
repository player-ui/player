import React from "react";
import { useSyncExternalStore } from "use-sync-external-store/shim";

export type SubscribeID = number;

type ResolveType<T> = (arg?: T) => void;
type RejectType = (error?: Error) => void;
type StatusType = "success" | "failure" | "pending";
type DefferedReturnType<T> = {
  /** a function to resolve the promise */
  resolve: ResolveType<T>;

  /** a function to reject the promise */
  reject: RejectType;

  /** the status of the promise */
  status: StatusType;

  /** a promise to express the above */
  promise: Promise<T>;
};

/** create a deferred promise */
function deferred<T>(): DefferedReturnType<T> {
  /** the default resolve handler is a noop */
  let resolve: ResolveType<T> = () => undefined;

  /** the default reject handler is a noop */
  let reject: RejectType = () => undefined;

  let status: StatusType = "pending";

  const promise = new Promise<T>((res, rej) => {
    resolve = (a?: T) => {
      status = "success";
      const resolveFunc = res as ResolveType<T>;
      resolveFunc(a);
    };

    reject = (error?: Error) => {
      status = "failure";
      rej(error);
    };
  });

  return {
    resolve,
    status,
    reject,
    promise,
  };
}

const NOT_CALLED = Symbol("Subscribe -- Empty Value");
/**
 * A pub-sub module that works across the React bridge
 */
export class Subscribe<T> {
  private callbacks: Map<SubscribeID, (val: T | undefined) => void> = new Map();
  private deferredResult = deferred<T>();
  private lastValue: T | typeof NOT_CALLED = NOT_CALLED;
  private resetDeferred: DefferedReturnType<void> | null = null;
  constructor() {
    this.publish = this.publish.bind(this);
    this.add = this.add.bind(this);
    this.remove = this.remove.bind(this);
  }

  /**
   * Trigger the subscriptions using the provided value
   * if there is a reset in progress, wait for it before publishing a new value.
   */
  async publish(val: T): Promise<void> {
    await this.resetDeferred?.promise;
    this.lastValue = val;
    this.deferredResult.resolve(val);
    this.callbacks.forEach((c) => c(val));
  }

  /**
   * Subscribe to updates
   */
  add(
    callback: (arg: T | undefined) => void,
    options?: {
      /** Use the last updated value for this subscription to immediately trigger the onSet callback */
      initializeWithPreviousValue?: boolean;
    },
  ): SubscribeID {
    const id = this.callbacks.size;
    this.callbacks.set(id, callback);

    if (
      this.lastValue !== NOT_CALLED &&
      options?.initializeWithPreviousValue === true
    ) {
      callback(this.lastValue);
    }

    return id;
  }

  /**
   * Remove any updates from the given listener
   */
  remove(id: SubscribeID): void {
    this.callbacks.delete(id);
  }

  /**
   * Reset the state of the listener
   * Passing in a promise will defer resetting the view until the promise is resolved
   */
  async reset(promise?: Promise<void>): Promise<void> {
    if (promise) {
      this.resetDeferred = deferred<void>();
      await promise;
    }

    if (this.lastValue !== NOT_CALLED) {
      this.deferredResult = deferred();
    }

    this.lastValue = NOT_CALLED;
    this.callbacks.forEach((c) => c(undefined));

    this.resetDeferred?.resolve();
    this.resetDeferred = null;
  }

  /**
   * _Throws_ a promise if the value is still pending
   * Otherwise returns it
   */
  suspend(): T {
    if (this.lastValue === NOT_CALLED) {
      throw this.deferredResult.promise;
    }

    return this.lastValue;
  }

  /** Get the current value of the subscription  */
  get(): T | undefined {
    if (this.lastValue === NOT_CALLED) {
      return undefined;
    }

    return this.lastValue;
  }
}

export interface SubscribedStateHookOptions {
  /** if the state should trigger suspense when waiting to resolve */
  suspend?: boolean;
}

/** Subscribe to a state change event in a react component */
export function useSubscribedState<T>(subscriber: Subscribe<T>): T | undefined {
  const subscription = React.useMemo(() => {
    function subscribe(callback: (val?: T) => void) {
      const id = subscriber.add(
        (resp) => {
          callback(resp);
        },
        {
          initializeWithPreviousValue: true,
        },
      );

      return () => {
        if (subscriber) {
          subscriber.remove(id);
        }
      };
    }

    return subscribe;
  }, [subscriber]);

  function getSnapshot() {
    try {
      return subscriber.get();
    } catch (err) {
      return undefined;
    }
  }

  const state = useSyncExternalStore(
    subscription,
    getSnapshot,
    () => undefined,
  );

  return state;
}
