import type {
  BatchSetTransaction,
  BindingInstance,
  BindingParser,
  DataController,
  DataModelMiddleware,
  ExpressionEvaluator,
  ExpressionHandler,
  InProgressState,
  Logger,
  NavigationFlowExternalState,
  NavigationFlowViewState,
  Player,
  PlayerPlugin,
  Updates,
  ViewController,
  ViewInstance,
} from "@player-ui/player";
import { resolveDataRefs } from "@player-ui/player";
import type { ExternalStateHandler } from "@player-ui/external-state-plugin";
import queueMicrotask from "queue-microtask";
import { collectChanges } from "./collectChanges";
import { ActiveLoad, CollectionState } from "./CollectionState";
import {
  CollectionDeclaration,
  findCollectionDeclarations,
} from "./findCollectionDeclarations";
import { MergeSummary, RecordCollection } from "./RecordCollection";
import { StreamingDataPluginSymbol } from "./symbols";
import { toCommitRequest } from "./toCommitRequest";
import type {
  CollectionHandle,
  CollectionStatus,
  CommitOutcome,
  CommitResult,
  LastCommit,
  RecordChanges,
  RecordSource,
} from "./types";

/** Starts loading a collection: loadStreamingData(binding) */
export const LOAD_EXPRESSION_NAME = "loadStreamingData";

/** Loads a collection again after its load failed: retryStreamingData(binding) */
export const RETRY_EXPRESSION_NAME = "retryStreamingData";

/** The `ref` of the EXTERNAL state that saves a collection's changes */
export const COMMIT_RECORDS_REF = "commit-records";

type Controllers = InProgressState["controllers"];

/** Options for StreamingDataPlugin */
export interface StreamingDataPluginOptions {
  /**
   * Whether a VIEW state shows as an overlay that closes when the flow leaves it, such as a
   * modal. A save started from an overlay shows the last view underneath it instead.
   */
  isOverlay?: (state: NavigationFlowViewState) => boolean;
}

// Player compares every changed binding with every binding each node read, so a long list of
// notices costs more than resolving everything once.
const MAX_RECORD_NOTICES = 50;

const messageOf = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);

const isIndexable = (
  value: unknown,
): value is Record<string | number, unknown> =>
  typeof value === "object" && value !== null;

/** Walks a relative binding path into a value without copying anything */
const getIn = (value: unknown, path: ReadonlyArray<string | number>): unknown =>
  path.reduce<unknown>(
    (current, segment) => (isIndexable(current) ? current[segment] : undefined),
    value,
  );

/** Whether two dotted bindings are equal or one sits underneath the other */
const overlaps = (a: string, b: string): boolean => {
  const left = a.split(".");
  const right = b.split(".");
  const shared = Math.min(left.length, right.length);
  return left
    .slice(0, shared)
    .every((segment, index) => segment === right[index]);
};

const failedCommit = (failedKeys: string[], error?: string): LastCommit => ({
  outcome: "failed",
  saved: 0,
  failed: failedKeys.length,
  failedKeys,
  ...(error === undefined ? undefined : { error }),
});

const outcomeOf = (result: CommitResult<object>): CommitOutcome => {
  if (result.failed.length === 0) return "saved";
  return result.records.length + result.removed.length > 0
    ? "partial"
    : "failed";
};

const keysOf = (changes: RecordChanges<object>): string[] => [
  ...changes.update.map(({ key }) => key),
  ...changes.remove,
];

/**
 * Loads large collections into Player in batches without storing them in the data model.
 *
 * A flow declares each collection in its schema, with the source that loads it, the binding its
 * status goes to, and the source's params. The app registers sources by name. Content starts a
 * load with loadStreamingData(binding), usually in a navigation onStart; reads never start one.
 * The plugin holds each record once, serves the array by reference at the collection's binding,
 * writes status to the status binding, and tells subscribers what changed. The collection's
 * binding is read-only and stays out of the serialized data model.
 *
 * Saves run in `commit-records` EXTERNAL states through commitRecordsHandler, which the app adds to
 * its ExternalStatePlugin: the handler collects the changes, calls the source's commit, merges the
 * returned records by key, and returns `saved`, `partial`, or `failed`. It never throws. Player
 * drops the current view when an EXTERNAL state starts, so the handler keeps the view that started
 * the save current, and updating, until the flow moves on; that view can show the save's progress.
 * A save started from an overlay (see StreamingDataPluginOptions) shows the view underneath it.
 *
 * The plugin doesn't sort, search, filter, or page; whatever shows the collection does.
 */
export class StreamingDataPlugin implements PlayerPlugin {
  name = "StreamingDataPlugin";

  readonly symbol: symbol = StreamingDataPluginSymbol;

  /** The handler for `commit-records` EXTERNAL states; see the class description */
  readonly commitRecordsHandler: ExternalStateHandler;

  private readonly sources: ReadonlyMap<string, RecordSource<object>>;

  /** Authorizes this plugin's own change notices through the middleware */
  private readonly writeSymbol: symbol = Symbol("streaming-data-refresh");

  private declared: CollectionDeclaration[] = [];

  // Per-flow state, replaced whenever a new flow starts.
  private states = new Map<string, CollectionState>();

  /** The same states as a list, since every data model read checks them */
  private stateList: CollectionState[] = [];

  private flowAbort?: AbortController;

  private dataController?: DataController;

  private parser?: BindingParser;

  private evaluator?: ExpressionEvaluator;

  private viewController?: ViewController;

  private lastView?: ViewInstance;

  private lastViewState?: NavigationFlowViewState;

  /** The last VIEW state that wasn't an overlay */
  private backgroundState?: NavigationFlowViewState;

  private readonly isOverlay: (state: NavigationFlowViewState) => boolean;

  private logger?: Logger;

  constructor(
    sources: Readonly<Record<string, RecordSource<object>>>,
    options: StreamingDataPluginOptions = {},
  ) {
    this.sources = new Map(Object.entries(sources));
    this.isOverlay = options.isOverlay ?? (() => false);
    this.commitRecordsHandler = {
      ref: COMMIT_RECORDS_REF,
      handlerFunction: (state, controllers) =>
        this.commitRecords(state, controllers),
    };
  }

  apply(player: Player): void {
    this.logger = player.logger;

    player.hooks.onStart.tap(this.name, (flow) => {
      const { declarations, problems } = findCollectionDeclarations(
        flow.schema,
      );
      problems.forEach(({ binding, problem }) =>
        this.logger?.error(
          `[${this.name}] Ignoring the source declared at '${binding}': ${problem}`,
        ),
      );
      this.declared = declarations;
    });

    player.hooks.bindingParser.tap(this.name, (parser) => {
      this.parser = parser;
    });

    player.hooks.expressionEvaluator.tap(this.name, (evaluator) => {
      this.evaluator = evaluator;
      evaluator.addExpressionFunction(LOAD_EXPRESSION_NAME, this.loadHandler);
      evaluator.addExpressionFunction(RETRY_EXPRESSION_NAME, this.retryHandler);
    });

    player.hooks.dataController.tap(this.name, (dataController) =>
      this.startFlow(dataController),
    );

    player.hooks.viewController.tap(this.name, (viewController) => {
      this.viewController = viewController;
    });

    player.hooks.view.tap(this.name, (view) => {
      this.lastView = view;
    });

    player.hooks.flowController.tap(this.name, (flowController) => {
      flowController.hooks.flow.tap(this.name, (flow) => {
        flow.hooks.transition.tap(this.name, (_from, to) => {
          if (to.value.state_type !== "VIEW") return;
          this.lastViewState = to.value;
          if (!this.isOverlay(to.value)) this.backgroundState = to.value;
        });
      });
    });

    player.hooks.onEnd.tap(this.name, () => this.teardownFlow());
  }

  /** The collection at `binding` in the current flow, for consumers such as a table */
  getCollection(binding: string): CollectionHandle | undefined {
    return this.find(binding)?.collection;
  }

  /** The status of the collection at `binding` */
  getStatus(binding: string): CollectionStatus | undefined {
    return this.find(binding)?.status;
  }

  /**
   * Starts loading the collection at `binding`. Does nothing if it already started with the same
   * params; with different params, drops the records and loads again.
   */
  load(binding: string): void {
    const state = this.find(binding);
    if (state) this.start(state, false);
  }

  /** Loads the collection at `binding` again, if its last load failed */
  retry(binding: string): void {
    const state = this.find(binding);
    if (state) this.start(state, true);
  }

  /** Saves `changes` through the collection's source; see commitRecordsHandler */
  async commit(
    binding: string,
    changes: RecordChanges<object>,
  ): Promise<CommitOutcome> {
    const state = this.find(binding);
    return state ? this.commitChanges(state, changes) : "failed";
  }

  /** Changes records locally, without saving: merges `records` by key and drops `removed` */
  merge(binding: string, records: object[], removed: string[] = []): void {
    const state = this.find(binding);
    if (!state) return;
    const change = state.collection.merge(records, removed);
    this.patchStatus(state, { loadedRecords: state.collection.records.length });
    this.notifyChanged(state, change);
  }

  private readonly middleware: DataModelMiddleware = {
    name: "streaming-data",

    get: (binding, options, next) => {
      const state = this.match(binding);
      if (!state) return next?.get(binding, options);
      const relative = binding.relative(state.binding);
      const { records } = state.collection;
      return relative.length === 0 ? records : getIn(records, relative);
    },

    set: (transaction, options, next) => {
      const ours: BatchSetTransaction = [];
      const others: BatchSetTransaction = [];
      transaction.forEach((entry) =>
        (this.match(entry[0]) ? ours : others).push(entry),
      );
      if (ours.length === 0) return next?.set(transaction, options) ?? [];

      const passed =
        others.length > 0 ? (next?.set(others, options) ?? []) : [];
      if (options?.writeSymbol !== this.writeSymbol) {
        ours.forEach(([binding]) =>
          this.logger?.warn(
            `[${this.name}] Ignoring a write to read-only ${binding.asString()}`,
          ),
        );
        return passed;
      }
      // A change notice: nothing to store, but subscribers re-read the binding.
      const notices: Updates = ours.map(([binding, value]) => ({
        binding,
        oldValue: undefined,
        newValue: value,
        force: true,
      }));
      return [...passed, ...notices];
    },

    delete: (binding, options, next) => {
      if (this.match(binding)) {
        this.logger?.warn(
          `[${this.name}] Ignoring a delete of read-only ${binding.asString()}`,
        );
        return undefined;
      }
      return next?.delete(binding, options);
    },
  };

  private startFlow(dataController: DataController): void {
    this.teardownFlow();
    this.dataController = dataController;
    const flowAbort = new AbortController();
    this.flowAbort = flowAbort;
    this.states = this.createStates();
    this.stateList = [...this.states.values()];

    dataController.hooks.resolveDataStages.tap(this.name, (pipeline) => [
      ...pipeline,
      this.middleware,
    ]);

    // Player is still setting up the flow, including validation, when this hook runs.
    queueMicrotask(() => {
      if (this.dataController !== dataController || flowAbort.signal.aborted)
        return;
      this.states.forEach((state) => this.patchStatus(state, {}));
    });
  }

  private createStates(): Map<string, CollectionState> {
    const { parser } = this;
    const states = new Map<string, CollectionState>();
    if (!parser) return states;
    const used: string[] = [];

    this.declared.forEach(({ binding, source: declaration }) => {
      const parsed = parser.parse(binding);
      const bindingString = parsed.asString();
      const statusBinding = parser
        .parse(declaration.status ?? `${binding}Status`)
        .asString();
      const clash = used.find(
        (other) =>
          overlaps(other, bindingString) || overlaps(other, statusBinding),
      );
      if (clash || overlaps(bindingString, statusBinding)) {
        this.logger?.error(
          `[${this.name}] Ignoring '${binding}': it or its status overlaps '${
            clash ?? statusBinding
          }'`,
        );
        return;
      }
      used.push(bindingString, statusBinding);

      const source = this.sources.get(declaration.ref);
      const keyOf = (record: object): string => source?.key(record) ?? "";
      const collection = new RecordCollection<object>(
        bindingString,
        statusBinding,
        keyOf,
      );
      states.set(
        bindingString,
        new CollectionState(parsed, declaration, collection, source),
      );
    });

    return states;
  }

  private resolveParams(
    state: CollectionState,
  ): Readonly<Record<string, unknown>> {
    const { dataController, evaluator } = this;
    const params = state.declaration.params ?? {};
    if (!dataController) return params;
    return resolveDataRefs(params, {
      model: dataController,
      evaluate: evaluator
        ? (expression) => evaluator.evaluate(expression)
        : false,
      formatted: false,
    });
  }

  private start(state: CollectionState, retry: boolean): void {
    const { flowAbort } = this;
    if (!flowAbort || (retry && !state.status.error)) return;

    const params = this.resolveParams(state);
    const paramsKey = JSON.stringify(params);
    if (!retry && state.load?.paramsKey === paramsKey) return;

    const controller = new AbortController();
    flowAbort.signal.addEventListener("abort", () => controller.abort(), {
      once: true,
    });
    const load: ActiveLoad = { params, paramsKey, controller };
    state.begin(load);
    // Started outside the expression or read that asked for it, which mustn't write to the model.
    queueMicrotask(() => {
      this.run(state, load);
    });
  }

  private async run(state: CollectionState, load: ActiveLoad): Promise<void> {
    const { dataController } = this;
    const isCurrent = (): boolean =>
      !load.controller.signal.aborted &&
      state.load === load &&
      this.dataController === dataController;
    if (!isCurrent()) return;

    if (state.collection.records.length > 0) {
      state.collection.clear();
      this.notifyChanged(state);
    }
    const { committing, lastCommit } = state.status;
    this.writeStatus(
      state,
      state.reset({ committing, lastCommit, started: true, loading: true }),
    );

    const { source } = state;
    if (!source) {
      this.patchStatus(state, {
        loading: false,
        error: `No source is registered as '${state.declaration.ref}'`,
      });
      return;
    }

    try {
      for await (const batch of source.load({
        params: load.params,
        signal: load.controller.signal,
      })) {
        if (!isCurrent()) return;
        const change = state.collection.append(batch.records);
        const loadedBatches = state.status.loadedBatches + 1;
        const totalBatches = batch.totalBatches ?? state.status.totalBatches;
        this.patchStatus(state, {
          loadedBatches,
          totalBatches,
          loadedRecords: state.collection.records.length,
          progress: totalBatches
            ? Math.min(1, loadedBatches / totalBatches)
            : 0,
        });
        this.notifyChanged(state, change);
      }
      if (isCurrent())
        this.patchStatus(state, {
          loading: false,
          completed: true,
          progress: 1,
        });
    } catch (error) {
      if (!isCurrent()) return;
      const message = messageOf(error);
      this.logger?.error(
        `[${this.name}] Loading '${state.collection.binding}' failed: ${message}`,
      );
      this.patchStatus(state, { loading: false, error: message });
    }
  }

  /**
   * Gives Player a current view again after the save's EXTERNAL state dropped it: the view that
   * started the save, or the view underneath it when that one is an overlay.
   */
  private showViewDuringSave(): void {
    const { viewController, lastView, lastViewState, backgroundState } = this;
    if (!viewController || viewController.currentView) return;
    if (lastViewState && this.isOverlay(lastViewState)) {
      if (backgroundState) viewController.onView(backgroundState);
    } else if (lastView) {
      viewController.currentView = lastView;
    }
  }

  private async commitRecords(
    externalState: NavigationFlowExternalState,
    controllers: Controllers,
  ): Promise<CommitOutcome> {
    this.showViewDuringSave();
    const request = toCommitRequest(externalState);
    if ("problem" in request) {
      this.logger?.error(`[${this.name}] Can't save: ${request.problem}`);
      return "failed";
    }
    const state = this.find(request.binding);
    if (!state) return "failed";

    try {
      const { data, expression } = controllers;
      const changes = collectChanges(state.collection, request, {
        get: (binding) => data.get(binding),
        set: (binding, value) => {
          data.set([[binding, value]]);
        },
        delete: (binding) => data.delete(binding),
        evaluate: (exp) => expression.evaluate(exp),
      });
      return await this.commitChanges(state, changes);
    } catch (error) {
      const message = messageOf(error);
      this.logger?.error(
        `[${this.name}] Saving '${request.binding}' failed: ${message}`,
      );
      this.patchStatus(state, {
        committing: false,
        lastCommit: failedCommit([], message),
      });
      return "failed";
    }
  }

  private async commitChanges(
    state: CollectionState,
    changes: RecordChanges<object>,
  ): Promise<CommitOutcome> {
    const { dataController, flowAbort } = this;
    const count =
      changes.create.length + changes.update.length + changes.remove.length;
    if (count === 0) {
      this.patchStatus(state, {
        lastCommit: { outcome: "saved", saved: 0, failed: 0, failedKeys: [] },
      });
      state.collection.committed("saved");
      return "saved";
    }

    const { source } = state;
    if (!source?.commit || !flowAbort) {
      this.patchStatus(state, {
        lastCommit: failedCommit(
          keysOf(changes),
          "This collection's source can't save.",
        ),
      });
      return "failed";
    }

    this.patchStatus(state, { committing: true });
    try {
      const params = state.load?.params ?? this.resolveParams(state);
      const result = await source.commit(changes, {
        params,
        signal: flowAbort.signal,
      });
      // The flow ended while the save ran; its records are gone.
      if (this.dataController !== dataController) return outcomeOf(result);

      const change = state.collection.merge(result.records, result.removed);
      const outcome = outcomeOf(result);
      const saved = result.records.length + result.removed.length;
      this.patchStatus(state, {
        committing: false,
        loadedRecords: state.collection.records.length,
        lastCommit: {
          outcome,
          saved,
          failed: result.failed.length,
          failedKeys: result.failed.map(({ key }) => key),
        },
      });
      if (saved > 0) state.collection.committed(outcome);
      this.notifyChanged(state, change);
      return outcome;
    } catch (error) {
      const message = messageOf(error);
      if (this.dataController === dataController) {
        this.logger?.error(
          `[${this.name}] Saving '${state.collection.binding}' failed: ${message}`,
        );
        this.patchStatus(state, {
          committing: false,
          lastCommit: failedCommit(keysOf(changes), message),
        });
      }
      return "failed";
    }
  }

  /** Merges a status change and writes it to the status binding */
  private patchStatus(
    state: CollectionState,
    change: Partial<CollectionStatus>,
  ): void {
    this.writeStatus(state, state.patch(change));
  }

  private writeStatus(state: CollectionState, status: CollectionStatus): void {
    this.dataController?.set([[state.collection.statusBinding, status]]);
  }

  /**
   * Tells Player what changed, so whatever reads it resolves again. Player treats a change as
   * touching every binding inside it, so announcing the whole collection would resolve every row a
   * view shows. Appends announce `<binding>.length`, which only readers of the whole list care
   * about, and replaced records announce their own indexes. Removals move records to other
   * indexes, so they announce the whole collection, as a merge too big to list does.
   */
  private notifyChanged(state: CollectionState, change?: MergeSummary): void {
    const { binding } = state.collection;
    const bindings =
      change &&
      change.removed === 0 &&
      change.updatedIndexes.length <= MAX_RECORD_NOTICES
        ? [
            ...change.updatedIndexes.map((index) => `${binding}.${index}`),
            ...(change.appended > 0 ? [`${binding}.length`] : []),
          ]
        : [binding];
    if (bindings.length === 0) return;
    const revision = state.nextRevision();
    this.dataController?.set(
      bindings.map((changed) => [changed, revision]),
      { writeSymbol: this.writeSymbol },
    );
  }

  private match(binding: BindingInstance): CollectionState | undefined {
    return this.stateList.find((state) => state.binding.contains(binding));
  }

  private find(binding: string): CollectionState | undefined {
    const state =
      this.states.get(binding) ??
      (this.parser
        ? this.states.get(this.parser.parse(binding).asString())
        : undefined);
    if (!state)
      this.logger?.warn(
        `[${this.name}] No collection is declared at '${binding}'`,
      );
    return state;
  }

  private teardownFlow(): void {
    this.flowAbort?.abort();
    this.flowAbort = undefined;
    this.dataController = undefined;
    this.lastView = undefined;
    this.lastViewState = undefined;
    this.backgroundState = undefined;
    // Dropped so a large collection can be collected as soon as the flow ends.
    this.states = new Map();
    this.stateList = [];
  }

  private readonly loadHandler: ExpressionHandler<[string]> = (
    context,
    binding,
  ) => {
    this.load(binding);
  };

  private readonly retryHandler: ExpressionHandler<[string]> = (
    context,
    binding,
  ) => {
    this.retry(binding);
  };
}
