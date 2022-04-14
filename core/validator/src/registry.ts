import type { ValidatorFunction } from './types';

/** A registry that tracks validators  */
export class ValidatorRegistry {
  private registry: Map<string, ValidatorFunction<any>>;

  constructor() {
    this.registry = new Map();
  }

  /** Use the given validator name to fetch the handler */
  public get(name: string): ValidatorFunction | undefined {
    return this.registry.get(name);
  }

  /** Register a new validator */
  public register<T>(name: string, handler: ValidatorFunction<T>) {
    this.registry.set(name, handler);
  }
}
