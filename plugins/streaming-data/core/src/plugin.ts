import type {
  BatchSetTransaction,
  BindingInstance,
  BindingParser,
  DataController,
  DataModelMiddleware,
  ExpressionHandler,
  Logger,
  Player,
  PlayerPlugin,
  Updates,
} from "@player-ui/player";
import { StreamingDataStore } from "./store";
import { StreamingDataPluginSymbol } from "./symbols";
import type {
  StreamingDataSortDirection,
  StreamingDataSourceConfig,
  StreamingDataStatus,
} from "./types";

/** The expression used to sort a streamed data source: sortStreamingData(binding, field?, direction?) */
export const SORT_EXPRESSION_NAME = "sortStreamingData";

/** The expression used to search a streamed data source: searchStreamingData(binding, query?) */
export const SEARCH_EXPRESSION_NAME = "searchStreamingData";

/** The expression used to clear sort + search on a streamed data source: clearStreamingDataQuery(binding) */
export const CLEAR_QUERY_EXPRESSION_NAME = "clearStreamingDataQuery";

const INITIAL_STATUS: StreamingDataStatus = {
  started: false,
  loading: false,
  completed: false,
  loadedPages: 0,
  totalRecords: 0,
};

/** Walk a relative binding path into a value without copying anything */
const getIn = (
  value: unknown,
  path: ReadonlyArray<string | number>,
): unknown => {
  let current: any = value;

  for (const segment of path) {
    if (current === undefined || current === null) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
};

/** The per-flow state tracked for one configured source */
interface SourceState {
  /** The source configuration */
  config: StreamingDataSourceConfig<any>;

  /** The in-memory record store */
  store: StreamingDataStore<any>;

  /** The parsed data binding */
  binding: BindingInstance;

  /** The data binding as a string */
  bindingString: string;

  /** The status binding as a string */
  statusBindingString: string;

  /** The last status written to the data model */
  status: StreamingDataStatus;

  /** True once the loader has been kicked off */
  started: boolean;

  /** True while a lazy start is queued behind the current data-model read */
  startQueued: boolean;
}

/**
 * A plugin that loads large, paginated data sets into Player without storing
 * them in the data model.
 *
 * Records are fetched by a team-provided `StreamingDataLoader`, held in plugin
 * memory, and served to Player through a data-model middleware at the
 * configured binding. Content references the data like any other binding
 * (`{{myData}}`, `{{myData.5.name}}`), pagination status is published to a
 * sibling status binding, and sort/search operations are exposed as
 * expressions so the data stays queryable through normal Player mechanisms.
 *
 * The streamed binding is read-only: writes and deletes against it are
 * ignored (with a warning) so the shared in-memory copy can't be corrupted.
 * It is also excluded from data-model serialization.
 */
export class StreamingDataPlugin implements PlayerPlugin {
  name = "streaming-data";

  public readonly symbol: symbol = StreamingDataPluginSymbol;

  private readonly configs: Array<StreamingDataSourceConfig<any>>;

  /** Authorizes this plugin's own refresh writes through the middleware */
  private readonly writeSymbol: symbol = Symbol("streaming-data-refresh");

  // Per-flow state. Replaced whenever a new flow starts.
  private sources: Map<string, SourceState> = new Map();
  private abortController?: AbortController;
  private dataController?: DataController;
  private parser?: BindingParser;
  private logger?: Logger;

  constructor(
    config:
      | StreamingDataSourceConfig<any>
      | Array<StreamingDataSourceConfig<any>>,
  ) {
    this.configs = Array.isArray(config) ? config : [config];

    if (this.configs.length === 0) {
      throw new Error(
        "StreamingDataPlugin requires at least one source configuration",
      );
    }

    this.validateConfigs();
  }

  public apply(player: Player): void {
    this.logger = player.logger;

    player.hooks.bindingParser.tap(this.name, (parser) => {
      this.parser = parser;
    });

    player.hooks.dataController.tap(this.name, (dataController) => {
      // A new flow is starting. Abort any loading still in flight from the last one.
      this.teardownFlow();

      this.dataController = dataController;
      const abortController = new AbortController();
      this.abortController = abortController;
      this.sources = new Map(
        this.configs.map((config) => {
          const binding = this.parseBinding(config.binding);

          const state: SourceState = {
            config,
            store: new StreamingDataStore(config),
            binding,
            bindingString: binding.asString(),
            statusBindingString: this.parseBinding(
              config.statusBinding ?? `${config.binding}Status`,
            ).asString(),
            status: { ...INITIAL_STATUS },
            started: false,
            startQueued: false,
          };

          return [state.bindingString, state];
        }),
      );

      dataController.hooks.resolveDataStages.tap(this.name, (pipeline) => [
        ...pipeline,
        this.middleware,
      ]);

      // Defer the first data-model writes so every plugin gets to tap
      // resolveDataStages before the pipeline is locked in.
      queueMicrotask(() => {
        if (
          this.dataController !== dataController ||
          abortController.signal.aborted
        ) {
          return;
        }

        for (const state of this.sources.values()) {
          this.patchStatus(state, {});

          if (state.config.lazy !== true) {
            this.startLoading(state);
          }
        }
      });
    });

    player.hooks.expressionEvaluator.tap(this.name, (evaluator) => {
      evaluator.addExpressionFunction(SORT_EXPRESSION_NAME, this.sortHandler);
      evaluator.addExpressionFunction(
        SEARCH_EXPRESSION_NAME,
        this.searchHandler,
      );
      evaluator.addExpressionFunction(
        CLEAR_QUERY_EXPRESSION_NAME,
        this.clearQueryHandler,
      );
    });

    player.hooks.onEnd.tap(this.name, () => {
      this.teardownFlow();
    });
  }

  /** Apply a sort to a streamed source. Omitting the field clears the sort */
  public sort(
    binding: string,
    field?: string,
    direction?: StreamingDataSortDirection,
  ): void {
    const state = this.findSourceByString(binding);

    if (!state) {
      return;
    }

    if (state.store.setSort(field, direction === "desc" ? "desc" : "asc")) {
      this.notifyDataChanged(state);
    }
  }

  /** Apply a search to a streamed source. Omitting the query clears the search */
  public search(binding: string, query?: string): void {
    const state = this.findSourceByString(binding);

    if (!state) {
      return;
    }

    if (state.store.setSearch(query)) {
      this.notifyDataChanged(state);
    }
  }

  /** Clear both search and sort on a streamed source */
  public clearQuery(binding: string): void {
    const state = this.findSourceByString(binding);

    if (!state) {
      return;
    }

    if (state.store.clearQuery()) {
      this.notifyDataChanged(state);
    }
  }

  /** The current loading status for a streamed source */
  public getStatus(binding: string): StreamingDataStatus | undefined {
    const state = this.findSourceByString(binding);
    return state ? { ...state.status } : undefined;
  }

  /** The current (query-applied) records for a streamed source */
  public getView(binding: string): ReadonlyArray<unknown> | undefined {
    return this.findSourceByString(binding)?.store.getView();
  }

  private readonly middleware: DataModelMiddleware = {
    name: "streaming-data",

    get: (binding, options, next) => {
      const state = this.matchSource(binding);

      if (!state) {
        return next?.get(binding, options);
      }

      if (state.config.lazy === true && !state.started && !state.startQueued) {
        // Start lazily, but outside of this read so we don't re-enter the model
        state.startQueued = true;
        queueMicrotask(() => {
          state.startQueued = false;
          this.startLoading(state);
        });
      }

      const view = state.store.getView();
      const relative = binding.relative(state.binding);

      return relative.length === 0 ? view : getIn(view, relative);
    },

    set: (transaction, options, next) => {
      let updates: Updates | undefined;
      let passthrough: BatchSetTransaction | undefined;
      let matched = false;

      for (let index = 0; index < transaction.length; index += 1) {
        const entry = transaction[index];
        const state = this.matchSource(entry[0]);

        if (!state) {
          if (matched) {
            (passthrough ??= []).push(entry);
          }

          continue;
        }

        if (!matched) {
          matched = true;
          passthrough = transaction.slice(0, index);
        }

        if (options?.writeSymbol === this.writeSymbol) {
          // Internal refresh: nothing to store, but report the change so
          // subscribers re-read the binding.
          (updates ??= []).push({
            binding: entry[0],
            oldValue: undefined,
            newValue: entry[1],
            force: true,
          });
        } else {
          this.logger?.warn(
            `[${this.name}] Ignoring write to read-only streamed binding: ${entry[0].asString()}`,
          );
        }
      }

      if (!matched) {
        return next?.set(transaction, options) ?? [];
      }

      const result =
        passthrough && passthrough.length > 0
          ? (next?.set(passthrough, options) ?? [])
          : [];

      return updates ? [...result, ...updates] : result;
    },

    delete: (binding, options, next) => {
      if (this.matchSource(binding)) {
        this.logger?.warn(
          `[${this.name}] Ignoring delete of read-only streamed binding: ${binding.asString()}`,
        );
        return;
      }

      return next?.delete(binding, options);
    },
  };

  private startLoading(state: SourceState): void {
    if (state.started || !this.abortController || !this.dataController) {
      return;
    }

    state.started = true;
    const { signal } = this.abortController;
    const dataController = this.dataController;

    /** True while this flow (and its data controller) is still the active one */
    const isCurrent = (): boolean =>
      !signal.aborted && this.dataController === dataController;

    const run = async (): Promise<void> => {
      this.patchStatus(state, { started: true, loading: true });

      try {
        for await (const page of state.config.loader.load({ signal })) {
          if (!isCurrent()) {
            return;
          }

          state.store.appendPage(page.records);

          this.patchStatus(state, {
            loadedPages: state.status.loadedPages + 1,
            totalRecords: state.store.recordCount,
            ...(page.totalPages !== undefined
              ? { totalPages: page.totalPages }
              : undefined),
          });

          if (page.records.length > 0) {
            this.notifyDataChanged(state);
          }
        }

        if (isCurrent()) {
          this.patchStatus(state, { loading: false, completed: true });
        }
      } catch (error) {
        if (!isCurrent()) {
          return;
        }

        const message = error instanceof Error ? error.message : String(error);
        this.logger?.error(
          `[${this.name}] Loader for '${state.bindingString}' failed: ${message}`,
        );
        this.patchStatus(state, { loading: false, error: message });
      }
    };

    void run();
  }

  /** Merge a status change and publish it to the status binding */
  private patchStatus(
    state: SourceState,
    patch: Partial<StreamingDataStatus>,
  ): void {
    state.status = { ...state.status, ...patch };
    this.dataController?.set([[state.statusBindingString, state.status]]);
  }

  /** Tell Player the streamed binding changed so dependent views re-resolve */
  private notifyDataChanged(state: SourceState): void {
    this.dataController?.set([[state.bindingString, state.store.revision]], {
      writeSymbol: this.writeSymbol,
    });
  }

  private matchSource(binding: BindingInstance): SourceState | undefined {
    for (const state of this.sources.values()) {
      if (state.binding.contains(binding)) {
        return state;
      }
    }

    return undefined;
  }

  private findSourceByString(binding: string): SourceState | undefined {
    const direct = this.sources.get(binding);

    if (direct) {
      return direct;
    }

    const state = this.parser
      ? this.sources.get(this.parser.parse(binding).asString())
      : undefined;

    if (!state) {
      this.logger?.warn(
        `[${this.name}] No streamed data source registered for binding: ${binding}`,
      );
    }

    return state;
  }

  private parseBinding(binding: string): BindingInstance {
    if (!this.parser) {
      throw new Error(
        `[${this.name}] Binding parser is not available before the flow starts`,
      );
    }

    return this.parser.parse(binding);
  }

  private teardownFlow(): void {
    this.abortController?.abort();
    this.abortController = undefined;
    this.dataController = undefined;
    // Drop record stores so large data sets are collectable as soon as the flow ends
    this.sources = new Map();
  }

  private readonly sortHandler: ExpressionHandler<
    [string, string?, StreamingDataSortDirection?]
  > = (context, binding, field, direction) => {
    this.sort(binding, field, direction);
  };

  private readonly searchHandler: ExpressionHandler<[string, string?]> = (
    context,
    binding,
    query,
  ) => {
    this.search(binding, query);
  };

  private readonly clearQueryHandler: ExpressionHandler<[string]> = (
    context,
    binding,
  ) => {
    this.clearQuery(binding);
  };

  private validateConfigs(): void {
    const bindings: Array<string> = [];

    for (const config of this.configs) {
      if (!config.binding || typeof config.binding !== "string") {
        throw new Error(
          "StreamingDataPlugin sources require a non-empty binding",
        );
      }

      bindings.push(
        config.binding,
        config.statusBinding ?? `${config.binding}Status`,
      );
    }

    // No binding may equal or sit underneath any other. Overlapping bindings
    // would make data reads and status writes ambiguous.
    for (let i = 0; i < bindings.length; i += 1) {
      for (let j = i + 1; j < bindings.length; j += 1) {
        const a = bindings[i].split(".");
        const b = bindings[j].split(".");
        const overlap = Math.min(a.length, b.length);

        if (a.slice(0, overlap).every((segment, k) => segment === b[k])) {
          throw new Error(
            `StreamingDataPlugin bindings must not overlap: '${bindings[i]}' and '${bindings[j]}'`,
          );
        }
      }
    }
  }
}
