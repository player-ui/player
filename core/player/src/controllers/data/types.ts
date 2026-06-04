import type { SyncHook, SyncWaterfallHook, SyncBailHook } from "tapable-ts";
import type { BindingInstance, BindingLike } from "../../binding";
import type {
  BatchSetTransaction,
  Updates,
  DataModelOptions,
  DataPipeline,
  PipelinedDataModel,
} from "../../data";
import type { RawSetTransaction } from "../../types";
import type { ReadOnlyDataController } from "./utils";

/** Hook surface exposed by any IDataController implementation */
export interface IDataControllerHooks {
  resolve: SyncWaterfallHook<[any]>;
  resolveDataStages: SyncWaterfallHook<[DataPipeline]>;
  resolveDefaultValue: SyncBailHook<[BindingInstance], any>;
  onDelete: SyncHook<[any]>;
  onSet: SyncHook<[BatchSetTransaction]>;
  onGet: SyncHook<[any, any]>;
  onUpdate: SyncHook<[Updates, DataModelOptions | undefined]>;
  format: SyncWaterfallHook<[any, BindingInstance]>;
  deformat: SyncWaterfallHook<[any, BindingInstance]>;
  serialize: SyncWaterfallHook<[any]>;
}

/**
 * Public contract for the data controller. The default implementation is
 * `DataController`. Consumers may provide an alternative via
 * `PlayerConfigOptions.services.data`.
 *
 * Any replacement must implement this full surface — internal callers and
 * plugins depend on every member here.
 */
export interface IDataController {
  hooks: IDataControllerHooks;

  get(binding: BindingLike, options?: DataModelOptions): any;
  set(transaction: RawSetTransaction, options?: DataModelOptions): Updates;
  delete(binding: BindingLike, options?: DataModelOptions): void;

  serialize(): object;
  getModel(): PipelinedDataModel;
  makeReadOnly(): ReadOnlyDataController;
}
