export interface Store {
  useLocalState<T>(initialState: T): readonly [T, (value: T) => void];
  useSharedState<T>(
    key: string | symbol,
  ): (initialState: T) => readonly [T, (value: T) => void];
}

interface SharedStore {
  getLocalStateFunction<T>(
    key: string | symbol,
    countKey: symbol,
  ): (initialState: T) => readonly [T, (value: T) => void];
  useSharedState<T>(
    key: string | symbol,
  ): (initialState: T) => readonly [T, (value: T) => void];
}

/** A store that holds on to state for a transform */
export class LocalStateStore implements SharedStore {
  private state: Map<string | symbol, any>;

  private updateCallback?: () => void;

  constructor(onUpdate?: () => void) {
    this.updateCallback = onUpdate;

    this.state = new Map();
  }

  public removeKey(key: symbol | string) {
    this.state.delete(key);
  }

  public reset() {
    this.state.clear();
  }

  useSharedState<T>(key: string | symbol) {
    return (initialState: T) => {
      if (!this.state.has(key)) {
        this.state.set(key, initialState);
      }

      return [
        this.state.get(key) as T,
        (newState: T) => {
          const current = this.state.get(key) as T;

          this.state.set(key, newState);

          if (current !== newState) {
            this.updateCallback?.();
          }
        },
      ] as const;
    };
  }

  getLocalStateFunction<T>(key: symbol, countKey: symbol) {
    return (initialState: T) => {
      // initialize if not already created
      if (!this.state.has(key)) {
        this.state.set(key, []);
      }

      if (!this.state.has(countKey)) {
        this.state.set(countKey, 0);
      }

      const localState = this.state.get(key);
      const oldCount = this.state.get(countKey);

      this.state.set(countKey, oldCount + 1);

      if (localState.length <= oldCount) {
        localState.push(initialState);
      }

      const value = localState[oldCount] as T;

      return [
        value,
        (newState: T) => {
          const oldValue = localState[oldCount] as T;
          localState[oldCount] = newState;

          if (oldValue !== newState) {
            this.updateCallback?.();
          }
        },
      ] as const;
    };
  }
}
