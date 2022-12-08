import { SyncHook } from 'tapable-ts';
import type { BindingLike, BindingFactory } from '../binding';
import { BindingInstance, isBinding } from '../binding';
import { NOOP_MODEL } from './noop-model';

export const ROOT_BINDING = new BindingInstance([]);
export type BatchSetTransaction = [BindingInstance, any][];

export type Updates = Array<{
  /** The updated binding */
  binding: BindingInstance;

  /** The old value */
  oldValue: any;

  /** The new value */
  newValue: any;

  /** Force the Update to be included even if no data changed */
  force?: boolean;
}>;

/** Options to use when getting or setting data */
export interface DataModelOptions {
  /**
   * The data (either to set or get) should represent a formatted value
   * For setting data, the data will be de-formatted before continuing in the pipeline
   * For getting data, the data will be formatted before returning
   */
  formatted?: boolean;

  /**
   * By default, fetching data will ignore any invalid data.
   * You can choose to grab the queued invalid data if you'd like
   * This is usually the case for user-inputs
   */
  includeInvalid?: boolean;

  /**
   * A flag to set to ignore any default value in the schema, and just use the raw value
   */
  ignoreDefaultValue?: boolean;

  /**
   * A flag to indicate that this update should happen silently
   */
  silent?: boolean;

  /** Other context associated with this request */
  context?: {
    /** The data model to use when getting other data from the context of this request */
    model: DataModelWithParser;
  };
}

export interface DataModelWithParser<Options = DataModelOptions> {
  get(binding: BindingLike, options?: Options): any;
  set(transaction: [BindingLike, any][], options?: Options): Updates;
}

export interface DataModelImpl<Options = DataModelOptions> {
  get(binding: BindingInstance, options?: Options): any;
  set(transaction: BatchSetTransaction, options?: Options): Updates;
}

export interface DataModelMiddleware {
  /** The name of the middleware */
  name?: string;

  set(
    transaction: BatchSetTransaction,
    options?: DataModelOptions,
    next?: DataModelImpl
  ): Updates;
  get(
    binding: BindingInstance,
    options?: DataModelOptions,
    next?: DataModelImpl
  ): any;
  reset?(): void;
}

/** Wrap the inputs of the DataModel with calls to parse raw binding inputs */
export function withParser<Options = unknown>(
  model: DataModelImpl<Options>,
  parseBinding: BindingFactory
): DataModelWithParser<Options> {
  /** Parse something into a binding if it requires it */
  function maybeParse(binding: BindingLike): BindingInstance {
    const parsed = isBinding(binding)
      ? binding
      : parseBinding(binding, {
          get: model.get,
          set: model.set,
        });

    if (!parsed) {
      throw new Error('Unable to parse binding');
    }

    return parsed;
  }

  return {
    get(binding, options?: Options) {
      return model.get(maybeParse(binding), options);
    },
    set(transaction, options?: Options) {
      return model.set(
        transaction.map(([key, val]) => [maybeParse(key), val]),
        options
      );
    },
  };
}

/** Wrap a middleware instance in a DataModel compliant API */
export function toModel(
  middleware: DataModelMiddleware,
  defaultOptions?: DataModelOptions,
  next?: DataModelImpl
): DataModelImpl {
  if (!next) {
    return middleware as DataModelImpl;
  }

  return {
    get: (binding: BindingInstance, options?: DataModelOptions) =>
      middleware.get(binding, options ?? defaultOptions, next),
    set: (transaction: BatchSetTransaction, options?: DataModelOptions) =>
      middleware.set(transaction, options ?? defaultOptions, next),
  };
}

export type DataPipeline = Array<DataModelMiddleware | DataModelImpl>;

/**
 * Given a set of steps in a pipeline, create the effective data-model
 */
export function constructModelForPipeline(
  pipeline: DataPipeline
): DataModelImpl {
  if (pipeline.length === 0) {
    return NOOP_MODEL;
  }

  if (pipeline.length === 1) {
    return pipeline[0];
  }

  /** Default and propagate the options into the nested calls */
  function createModelWithOptions(options?: DataModelOptions) {
    const model: DataModelImpl =
      pipeline.reduce<DataModelImpl | undefined>(
        (nextModel, middleware) => toModel(middleware, options, nextModel),
        undefined
      ) ?? NOOP_MODEL;

    return model;
  }

  return {
    get: (binding: BindingInstance, options?: DataModelOptions) => {
      return createModelWithOptions(options)?.get(binding, options);
    },
    set: (transaction, options) => {
      return createModelWithOptions(options)?.set(transaction, options);
    },
  };
}

/** A DataModel that manages middleware data handlers  */
export class PipelinedDataModel implements DataModelImpl {
  private pipeline: DataPipeline;
  private effectiveDataModel: DataModelImpl;

  public readonly hooks = {
    onSet: new SyncHook<[BatchSetTransaction]>(),
  };

  constructor(pipeline: DataPipeline = []) {
    this.pipeline = pipeline;
    this.effectiveDataModel = constructModelForPipeline(this.pipeline);
  }

  public setMiddleware(handlers: DataPipeline) {
    this.pipeline = handlers;
    this.effectiveDataModel = constructModelForPipeline(handlers);
  }

  public addMiddleware(handler: DataModelMiddleware) {
    this.pipeline = [...this.pipeline, handler];
    this.effectiveDataModel = constructModelForPipeline(this.pipeline);
  }

  public reset(model = {}) {
    this.pipeline.forEach((middleware) => {
      if ('reset' in middleware) {
        middleware.reset?.();
      }
    });

    this.set([[ROOT_BINDING, model]]);
  }

  public set(
    transaction: BatchSetTransaction,
    options?: DataModelOptions
  ): Updates {
    const appliedTransaction = this.effectiveDataModel.set(
      transaction,
      options
    );
    this.hooks.onSet.call(transaction);
    return appliedTransaction;
  }

  public get(binding: BindingInstance, options?: DataModelOptions): any {
    return this.effectiveDataModel.get(binding, options);
  }
}
