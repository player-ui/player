import { SyncHook, SyncWaterfallHook, SyncBailHook } from 'tapable-ts';
import { omit, removeAt } from 'timm';
import { dequal } from 'dequal';
import type { Logger } from '../logger';
import type { BindingParser, BindingLike } from '../binding';
import { BindingInstance } from '../binding';
import type {
  BatchSetTransaction,
  Updates,
  DataModelOptions,
  DataModelWithParser,
  DataPipeline,
  DataModelMiddleware,
} from '../data';
import { PipelinedDataModel, LocalModel } from '../data';
import type { RawSetTransaction } from '../types';

/** The orchestrator for player data */
export class DataController implements DataModelWithParser<DataModelOptions> {
  public hooks = {
    resolve: new SyncWaterfallHook(),
    resolveDataStages: new SyncWaterfallHook<[DataPipeline]>(),

    // On any set or get of an undefined value, redirect the value to be the default
    resolveDefaultValue: new SyncBailHook<[BindingInstance], any>(),

    onDelete: new SyncHook<[any]>(),

    onSet: new SyncHook<[BatchSetTransaction]>(),

    onGet: new SyncHook<[any, any]>(),

    onUpdate: new SyncHook<[Updates, DataModelOptions | undefined]>(),

    format: new SyncWaterfallHook<[any, BindingInstance]>(),

    deformat: new SyncWaterfallHook<[any, BindingInstance]>(),

    serialize: new SyncWaterfallHook<[any]>(),
  };

  private model?: PipelinedDataModel;
  private trash: Set<BindingInstance>;
  private pathResolver: BindingParser;
  private baseMiddleware: Array<DataModelMiddleware>;
  private logger?: Logger;

  constructor(
    model: Record<any, unknown> | undefined,
    options: {
      /** A means of parsing a raw binding to a Binding object */
      pathResolver: BindingParser;

      /** middleware to use. typically for validation */
      middleware?: Array<DataModelMiddleware>;

      /** A logger to use  */
      logger?: Logger;
    }
  ) {
    this.logger = options.logger;
    const middleware = options.middleware || [];
    this.baseMiddleware = [new LocalModel(model), ...middleware];

    this.trash = new Set();
    this.pathResolver = options.pathResolver;
  }

  public getModel(): PipelinedDataModel {
    if (!this.model) {
      const stages = this.hooks.resolveDataStages.call(this.baseMiddleware);
      const model = new PipelinedDataModel();
      model.setMiddleware(stages);
      this.model = model;
    }

    return this.model;
  }

  private resolveDataValue(
    binding: BindingInstance,
    value: any,
    deformat: boolean
  ) {
    if (deformat) {
      return this.hooks.deformat.call(value, binding);
    }

    return value;
  }

  public set(
    transaction: RawSetTransaction,
    options?: DataModelOptions
  ): Updates {
    let normalizedTransaction: BatchSetTransaction = [];

    if (Array.isArray(transaction)) {
      normalizedTransaction = transaction.map(([binding, value]) => {
        const parsed = this.pathResolver.parse(binding);

        return [
          parsed,
          this.resolveDataValue(parsed, value, Boolean(options?.formatted)),
        ];
      }) as BatchSetTransaction;
    } else {
      normalizedTransaction = Object.keys(transaction).map(
        (binding: string) => {
          const parsed = this.pathResolver.parse(binding);
          const val = transaction[binding];

          return [
            parsed,
            this.resolveDataValue(parsed, val, Boolean(options?.formatted)),
          ];
        }
      ) as BatchSetTransaction;
    }

    // Figure out what the base changes being applied are
    const setUpdates = normalizedTransaction.reduce<Updates>(
      (updates, [binding, newVal]) => {
        const oldVal = this.get(binding, { includeInvalid: true });

        const update = {
          binding,
          newValue: newVal,
          oldValue: oldVal,
        };

        if (dequal(oldVal, newVal)) {
          this.logger?.debug(
            `Skipping update for path: ${binding.asString()}. Value was unchanged: ${oldVal}`
          );
        } else {
          updates.push(update);

          this.logger?.debug(
            `Setting path: ${binding.asString()} from: ${oldVal} to: ${newVal}`
          );
        }

        return updates;
      },
      []
    );

    // Get the applied update
    const result = this.getModel().set(normalizedTransaction, options);

    // Add any extra bindings that were effected
    const setUpdateBindings = new Set(setUpdates.map((su) => su.binding));
    result.forEach((tr) => {
      if (
        !setUpdateBindings.has(tr.binding) &&
        (tr.force === true || !dequal(tr.oldValue, tr.newValue))
      ) {
        this.logger?.debug(
          `Path: ${tr.binding.asString()} was changed from: ${
            tr.oldValue
          } to: ${tr.newValue}`
        );
        setUpdates.push(tr);
      }
    });

    this.hooks.onSet.call(normalizedTransaction);

    if (setUpdates.length > 0) {
      this.hooks.onUpdate.call(setUpdates, options);
    }

    return result;
  }

  private resolve(binding: BindingLike, readOnly: boolean): BindingInstance {
    return Array.isArray(binding) || typeof binding === 'string'
      ? this.pathResolver.parse(binding, { readOnly })
      : binding;
  }

  public get(binding: BindingLike, options?: DataModelOptions) {
    const resolved =
      binding instanceof BindingInstance
        ? binding
        : this.resolve(binding, true);
    let result = this.getModel().get(resolved, options);

    if (result === undefined && !options?.ignoreDefaultValue) {
      const defaultVal = this.hooks.resolveDefaultValue.call(resolved);

      if (defaultVal !== result) {
        result = defaultVal;
      }
    }

    if (options?.formatted) {
      result = this.hooks.format.call(result, resolved);
    } else if (options?.formatted === false) {
      result = this.hooks.deformat.call(result, resolved);
    }

    this.hooks.onGet.call(binding, result);

    return result;
  }

  public delete(binding: BindingLike, options?: DataModelOptions) {
    if (
      typeof binding !== 'string' &&
      !Array.isArray(binding) &&
      !(binding instanceof BindingInstance)
    ) {
      throw new Error('Invalid arguments: delete expects a data path (string)');
    }

    const resolved =
      binding instanceof BindingInstance
        ? binding
        : this.resolve(binding, false);

    const parentBinding = resolved.parent();
    const property = resolved.key();
    const parentValue = this.get(parentBinding);

    const existedBeforeDelete =
      typeof parentValue === 'object' &&
      parentValue !== null &&
      Object.prototype.hasOwnProperty.call(parentValue, property);

    this.getModel().delete(resolved, options);

    if (existedBeforeDelete && !this.get(resolved)) {
      this.trash.add(resolved);
    }

    this.hooks.onDelete.call(resolved);
  }

  public serialize(): object {
    return this.hooks.serialize.call(this.get(''));
  }
}
