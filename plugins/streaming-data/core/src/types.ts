/** One batch of records a source's load delivers */
export interface RecordBatch<R> {
  records: R[];
  /** How many batches the load delivers in all, if the source knows; it may revise this */
  totalBatches?: number;
}

/** What a source receives for a load or a save */
export interface SourceContext {
  /** The collection's `params` with every template resolved, as they were when loading started */
  params: Readonly<Record<string, unknown>>;
  /** Aborted when the flow ends or a new load replaces this one */
  signal: AbortSignal;
}

/** One record a save changes: the changed fields, and the whole record with them applied */
export interface RecordUpdate<R> {
  key: string;
  patch: Partial<R>;
  record: R;
}

/** What a save asks the source to change */
export interface RecordChanges<R> {
  create: R[];
  update: Array<RecordUpdate<R>>;
  remove: string[];
}

/** A record the source couldn't save, and why */
export interface CommitFailure {
  key: string;
  reason: string;
}

/** What a save changed: the saved records as the backend returned them, and the keys it removed */
export interface CommitResult<R> {
  records: R[];
  removed: string[];
  failed: CommitFailure[];
}

/**
 * Loads a collection in batches and, optionally, saves changes to it. The plugin freezes records
 * and shares them, so a consumer that sorts or searches them keeps its own keys, made as records
 * arrive, instead of adding fields to them.
 */
export interface RecordSource<R extends object> {
  /** The record's key; an empty string for a draft that hasn't been saved yet */
  key(record: R): string;
  load(context: SourceContext): AsyncIterable<RecordBatch<R>>;
  commit?(
    changes: RecordChanges<R>,
    context: SourceContext,
  ): Promise<CommitResult<R>>;
}

/** A collection's declaration: the `source` property of its schema entry */
export interface CollectionSourceDeclaration {
  /** The name a source is registered under */
  ref: string;
  /** Where the plugin writes the collection's status; defaults to `<binding>Status` */
  status?: string;
  /** The source's inputs, as templates the plugin resolves when loading starts */
  params?: Record<string, unknown>;
}

/** How a save ended */
export type CommitOutcome = "saved" | "partial" | "failed";

/** The latest save's result */
export interface LastCommit {
  outcome: CommitOutcome;
  /** Records saved, including removed ones */
  saved: number;
  failed: number;
  failedKeys: string[];
  /** Why the save failed as a whole, if it did */
  error?: string;
}

/** A collection's status, which the plugin writes to the collection's status binding */
export interface CollectionStatus {
  started: boolean;
  loading: boolean;
  completed: boolean;
  loadedBatches: number;
  totalBatches?: number;
  loadedRecords: number;
  /** 0 to 1 when the total is known, otherwise 0 until loading completes */
  progress: number;
  /** True while a save is in flight */
  committing: boolean;
  lastCommit?: LastCommit;
  /** Why loading failed, if it did */
  error?: string;
}

/** A change to a collection's records, for consumers that keep more than the array */
export type CollectionChange<R> =
  | { type: "appended"; records: ReadonlyArray<R> }
  | { type: "updated"; records: ReadonlyArray<R> }
  | { type: "removed"; keys: ReadonlyArray<string> }
  | { type: "reset" }
  /** A save that changed at least one record has been merged */
  | { type: "committed"; outcome: CommitOutcome };

/** A loaded collection, as consumers such as a table see it */
export interface CollectionHandle<R extends object = object> {
  readonly binding: string;
  readonly statusBinding: string;
  /** Every record held, in load order; the same array until records are removed or reset */
  readonly records: ReadonlyArray<R>;
  key(record: R): string;
  /** The record's position in `records`, or -1 */
  indexOf(key: string): number;
  get(key: string): R | undefined;
  /** Returns a function that stops the notices */
  subscribe(listener: (change: CollectionChange<R>) => void): () => void;
}

/** A `commit-records` EXTERNAL state's `param`, plus the `eachRow` beside it */
export interface CommitRecordsRequest {
  /** The collection to save */
  binding: string;
  /** A binding holding the key, or list of keys, of the records `eachRow` may change */
  update?: string;
  /** Where each record is copied while `eachRow` runs */
  rowBinding?: string;
  /**
   * Expressions that change the record at `rowBinding`, from the state's `eachRow`. Not in `param`:
   * Player resolves the templates in `param` when the state starts.
   */
  eachRow: string[];
  /** A binding holding a draft: created without a key, otherwise its changed fields are saved */
  save?: string;
  /** A binding holding the key, or list of keys, of the records to remove */
  remove?: string;
}
