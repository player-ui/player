import { SyncHook, SyncWaterfallHook, SyncBailHook } from 'tapable';
import type { Logger } from '@player-ui/logger';
import { omit, removeAt } from 'timm';
import { dequal } from 'dequal';
import type { BindingParser, BindingLike } from '@player-ui/binding';
import { BindingInstance } from '@player-ui/binding';
import type {
  BatchSetTransaction,
  Updates,
  DataModelOptions,
  DataModelWithParser,
  DataPipeline,
  DataModelMiddleware,
} from '@player-ui/data';
import { PipelinedDataModel, LocalModel } from '@player-ui/data';
import type { RawSetTransaction } from './types';

/** The orchestrator for player data */
export class DataController implements DataModelWithParser<DataModelOptions> {
  public hooks = {
    resolve: new SyncWaterfallHook(['binding']),
    resolveDataStages: new SyncWaterfallHook<DataPipeline>(['pipeline']),

    // On any set or get of an undefined value, redirect the value to be the default
    resolveDefaultValue: new SyncBailHook<BindingInstance, any>(['binding']),

    onDelete: new SyncHook<any, void>(['binding']),
    onSet: new SyncHook<BatchSetTransaction, void>(['transaction']),
    onGet: new SyncHook<any, any, void>(['binding', 'result']),
    onUpdate: new SyncHook<Updates>(['updates']),

    format: new SyncWaterfallHook<any, BindingInstance>(['value', 'binding']),
    deformat: new SyncWaterfallHook<any, BindingInstance>(['value', 'binding']),

    serialize: new SyncWaterfallHook<any>(['data']),
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

        if (!dequal(oldVal, newVal)) {
          updates.push({
            binding,
            newValue: newVal,
            oldValue: oldVal,
          });
        }

        this.logger?.debug(
          `Setting path: ${binding.asString()} from: ${oldVal} to: ${newVal}`
        );

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
      this.hooks.onUpdate.call(setUpdates);
    }

    return result;
  }

  private resolve(binding: BindingLike): BindingInstance {
    return Array.isArray(binding) || typeof binding === 'string'
      ? this.pathResolver.parse(binding)
      : binding;
  }

  public get(binding: BindingLike, options?: DataModelOptions) {
    const resolved =
      binding instanceof BindingInstance ? binding : this.resolve(binding);
    let result = this.getModel().get(resolved, options);

    if (result === undefined && !options?.ignoreDefaultValue) {
      const defaultVal = this.hooks.resolveDefaultValue.call(resolved);

      if (defaultVal !== result) {
        result = defaultVal;
      }
    }

    if (options?.formatted) {
      result = this.hooks.format.call(result, resolved);
    }

    this.hooks.onGet.call(binding, result);

    return result;
  }

  public delete(binding: BindingLike) {
    if (binding === undefined || binding === null) {
      throw new Error(`Invalid arguments: delete expects a data path (string)`);
    }

    const resolved = this.resolve(binding);
    this.hooks.onDelete.call(resolved);
    this.deleteData(resolved);
  }

  public getTrash(): Set<BindingInstance> {
    return this.trash;
  }

  private addToTrash(binding: BindingInstance) {
    this.trash.add(binding);
  }

  private deleteData(binding: BindingInstance) {
    const parentBinding = binding.parent();
    const parentPath = parentBinding.asString();
    const property = binding.key();

    const existedBeforeDelete = Object.prototype.hasOwnProperty.call(
      this.get(parentBinding),
      property
    );

    if (property !== undefined) {
      const parent = parentBinding ? this.get(parentBinding) : undefined;

      // If we're deleting an item in an array, we just splice it out
      // Don't add it to the trash
      if (parentPath && Array.isArray(parent)) {
        if (parent.length > property) {
          this.set([[parentBinding, removeAt(parent, property as number)]]);
        }
      } else if (parentPath && parent[property]) {
        this.set([[parentBinding, omit(parent, property as string)]]);
      } else if (!parentPath) {
        this.getModel().reset(omit(this.get(''), property as string));
      }
    }

    if (existedBeforeDelete && !this.get(binding)) {
      this.addToTrash(binding);
    }
  }

  public serialize(): object {
    return this.hooks.serialize.call(this.get(''));
  }
}
