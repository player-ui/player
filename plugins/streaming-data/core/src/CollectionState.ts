import type { BindingInstance } from "@player-ui/player";
import type { RecordCollection } from "./RecordCollection";
import type {
  CollectionSourceDeclaration,
  CollectionStatus,
  RecordSource,
} from "./types";

/** One load of a collection: the params it resolved, and how to cancel it */
export interface ActiveLoad {
  params: Readonly<Record<string, unknown>>;
  paramsKey: string;
  controller: AbortController;
}

export const INITIAL_STATUS: CollectionStatus = {
  started: false,
  loading: false,
  completed: false,
  loadedBatches: 0,
  loadedRecords: 0,
  progress: 0,
  committing: false,
};

/** The per-flow state of one declared collection */
export class CollectionState {
  readonly binding: BindingInstance;

  readonly declaration: CollectionSourceDeclaration;

  readonly source?: RecordSource<object>;

  readonly collection: RecordCollection<object>;

  private currentStatus: CollectionStatus = INITIAL_STATUS;

  private currentLoad?: ActiveLoad;

  private revisionCount = 0;

  constructor(
    binding: BindingInstance,
    declaration: CollectionSourceDeclaration,
    collection: RecordCollection<object>,
    source?: RecordSource<object>,
  ) {
    this.binding = binding;
    this.declaration = declaration;
    this.collection = collection;
    this.source = source;
  }

  get status(): CollectionStatus {
    return this.currentStatus;
  }

  get load(): ActiveLoad | undefined {
    return this.currentLoad;
  }

  /** Merges a status change; returns the new status */
  patch(change: Partial<CollectionStatus>): CollectionStatus {
    this.currentStatus = { ...this.currentStatus, ...change };
    return this.currentStatus;
  }

  /** Starts the status over from INITIAL_STATUS, dropping the last load's error and totals */
  reset(change: Partial<CollectionStatus>): CollectionStatus {
    this.currentStatus = { ...INITIAL_STATUS, ...change };
    return this.currentStatus;
  }

  /** Makes `load` the current load, cancelling the one before it */
  begin(load: ActiveLoad): void {
    this.currentLoad?.controller.abort();
    this.currentLoad = load;
  }

  /** A new value for each change notice written to the data model */
  nextRevision(): number {
    this.revisionCount += 1;
    return this.revisionCount;
  }
}
