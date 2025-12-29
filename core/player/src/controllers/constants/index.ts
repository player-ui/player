import { LocalModel } from "../../data";
import { BindingInstance } from "../../binding";
import { objectToBatchSet } from "./utils";
import { PlayerRuntimeConfig } from "../../types";

export interface ConfigProvider {
  /**
   * returns a single configuration value
   * @param key config path to read
   */
  getConfigValue<T extends keyof PlayerRuntimeConfig>(
    key: T,
  ): PlayerRuntimeConfig[T];

  /**
   * Override a specific configuration item.
   * @param key config path to set
   * @param value value to set it to
   */
  overrideConfigValue<T extends keyof PlayerRuntimeConfig>(
    key: T,
    value: PlayerRuntimeConfig[T],
  ): void;
}

export interface ConstantsProvider {
  /**
   * Function to add constants to the providers store
   * - @param data values to add to the constants store
   */
  addConstants(data: Record<string, any>, namespace: string): void;

  /**
   * Function to retrieve constants from the providers store
   *  - @param key Key used for the store access
   *  - @param namespace namespace values were loaded under (defined in the plugin)
   *  - @param fallback Optional - if key doesn't exist in namespace what to return (will return unknown if not provided)
   */
  getConstants(key: any, namespace: string, fallback?: any): any;

  /**
   * Function to set values to temporarily override certain keys in the perminant store
   * - @param data values to override store with
   * - @param namespace namespace to override
   */
  setTemporaryValues(data: any, namespace: string): void;

  /**
   * Clears any temporary values that were previously set
   */
  clearTemporaryValues(): void;
}

/**
 * Key/Value store for constants and context for Player
 */
export class ConstantsController implements ConstantsProvider, ConfigProvider {
  /**
   * Dedicated data store for Player's runtime config to isolate it from other constants
   */
  private config: LocalModel;

  /**
   * Data store is basically a map of namespaces to DataModels to provide some data isolation
   */
  private store: Map<string, LocalModel>;

  /**
   * Separate store for temporary flow specific overrides.
   * They are kept in a separate data model to make clearing it easier between flows
   * and so there is no confusion on what is static and what is temporary
   */
  private tempStore: Map<string, LocalModel>;

  constructor(runtimeConfig?: Record<string, any>) {
    this.store = new Map();
    this.tempStore = new Map();
    this.config = new LocalModel(runtimeConfig);
  }
  overrideConfigValue<T extends keyof PlayerRuntimeConfig>(
    key: T,
    value: PlayerRuntimeConfig[T],
  ): void {
    this.config.set([[new BindingInstance(key), value]]);
  }

  getConfigValue<T extends keyof PlayerRuntimeConfig>(
    key: T | string,
  ): PlayerRuntimeConfig[T] {
    return this.config.get(new BindingInstance(key)) ?? null;
  }

  addConstants(data: any, namespace: string): void {
    if (this.store.has(namespace)) {
      this.store.get(namespace)?.set(objectToBatchSet(data));
    } else {
      this.store.set(namespace, new LocalModel(data));
    }
  }

  getConstants(key: string, namespace: string, fallback?: any): any {
    const path = new BindingInstance(key);

    return (
      this.tempStore.get(namespace)?.get(path) ??
      this.store.get(namespace)?.get(path) ??
      fallback
    );
  }

  setTemporaryValues(data: any, namespace: string): void {
    if (this.tempStore.has(namespace)) {
      this.tempStore.get(namespace)?.set(objectToBatchSet(data));
    } else {
      this.tempStore.set(namespace, new LocalModel(data));
    }
  }

  clearTemporaryValues(namespace?: string): void {
    if (namespace) {
      this.tempStore.get(namespace)?.reset();
    } else {
      this.tempStore.forEach((value: LocalModel) => {
        value.reset();
      });
    }
  }
}
