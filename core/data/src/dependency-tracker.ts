import type { BindingInstance } from '@player-ui/binding';
import type {
  BatchSetTransaction,
  DataModelImpl,
  DataModelMiddleware,
  DataModelOptions,
  Updates,
} from './model';

export type DependencySets = 'core' | 'children';

/** A class to track usage of read/writes to/from a data model */
export class DependencyTracker {
  protected readDeps: Set<BindingInstance>;
  protected writeDeps: Set<BindingInstance>;
  protected namedSet: DependencySets;

  private namedDependencySets: Partial<
    Record<
      DependencySets,
      {
        /** readDeps */
        readDeps: Set<BindingInstance>;
        /** writeDeps */
        writeDeps: Set<BindingInstance>;
      }
    >
  >;

  constructor() {
    this.readDeps = new Set();
    this.writeDeps = new Set();
    this.namedDependencySets = {};
    this.namedSet = 'core';

    this.createSubset('core');
    this.createSubset('children');
  }

  protected createSubset(name: DependencySets, force = false): void {
    if (force || !this.namedDependencySets[name]) {
      this.namedDependencySets[name] = {
        readDeps: new Set(),
        writeDeps: new Set(),
      };
    }
  }

  /** Grab all of the bindings that this depended on */
  public getDependencies(name?: DependencySets): Set<BindingInstance> {
    if (name !== undefined) {
      return this.namedDependencySets?.[name]?.readDeps ?? new Set();
    }

    return this.readDeps;
  }

  public trackSubset(name: DependencySets) {
    this.createSubset(name);
    this.namedSet = name;
  }

  public trackDefault() {
    this.namedSet = 'core';
  }

  /** Grab all of the bindings this wrote to */
  public getModified(name?: DependencySets): Set<BindingInstance> {
    if (name !== undefined) {
      return this.namedDependencySets?.[name]?.writeDeps ?? new Set();
    }

    return this.writeDeps;
  }

  /**
   * Check to see if the dataModel has read the value at the given binding
   *
   * @param binding - The binding you want to check for
   */
  public readsBinding(binding: BindingInstance): boolean {
    return this.readDeps.has(binding);
  }

  /**
   * Check to see if the dataModel has written to the binding
   */
  public writesBinding(binding: BindingInstance): boolean {
    return this.writeDeps.has(binding);
  }

  /** Reset all tracking of dependencies */
  public reset() {
    this.readDeps = new Set();
    this.writeDeps = new Set();
    this.namedDependencySets = {};
    this.namedSet = 'core';

    this.createSubset('core', true);
    this.createSubset('children', true);
  }

  protected addReadDep(
    binding: BindingInstance,
    namedSet = this.namedSet
  ): void {
    if (namedSet) {
      this.namedDependencySets?.[namedSet]?.readDeps.add(binding);
    }

    this.readDeps.add(binding);
  }

  protected addWriteDep(
    binding: BindingInstance,
    namedSet = this.namedSet
  ): void {
    if (namedSet) {
      this.namedDependencySets?.[namedSet]?.writeDeps.add(binding);
    }

    this.writeDeps.add(binding);
  }

  public addChildReadDep(binding: BindingInstance): void {
    this.addReadDep(binding, 'children');
  }
}

/** Middleware that tracks dependencies of read/written data */
export class DependencyMiddleware
  extends DependencyTracker
  implements DataModelMiddleware
{
  constructor() {
    super();
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
  }

  public set(
    transaction: BatchSetTransaction,
    options?: DataModelOptions,
    next?: DataModelImpl | undefined
  ): Updates {
    transaction.forEach(([binding]) => this.addWriteDep(binding));

    return next?.set(transaction, options) ?? [];
  }

  public get(
    binding: BindingInstance,
    options?: DataModelOptions,
    next?: DataModelImpl | undefined
  ) {
    this.addReadDep(binding);

    return next?.get(binding, options);
  }
}

/** A data-model that tracks dependencies of read/written data */
export class DependencyModel<Options = DataModelOptions>
  extends DependencyTracker
  implements DataModelImpl<Options>
{
  private readonly rootModel: DataModelImpl<Options>;

  constructor(rootModel: DataModelImpl<Options>) {
    super();
    this.rootModel = rootModel;
    this.set = this.set.bind(this);
    this.get = this.get.bind(this);
  }

  public set(transaction: BatchSetTransaction, options?: Options): Updates {
    transaction.forEach(([binding]) => this.addWriteDep(binding));

    return this.rootModel.set(transaction, options);
  }

  public get(binding: BindingInstance, options?: Options) {
    this.addReadDep(binding);

    return this.rootModel.get(binding, options);
  }
}
