import type { Binding } from "@player-ui/player";
import type { StreamingDataLoader } from "./loader";

/** A single page of records delivered by a loader */
export interface StreamingDataPage<TRecord = unknown> {
  /** The records contained in this page */
  records: Array<TRecord>;

  /**
   * The total number of pages the loader expects to deliver, if known.
   * Loaders may report (or revise) this on any page as their backend reveals more information.
   */
  totalPages?: number;
}

/** Context handed to a loader when Player asks it to start loading */
export interface StreamingDataLoadContext {
  /**
   * Aborted when Player no longer needs the data.
   * This happens when the flow ends or a new flow is started.
   * Loaders should stop fetching (and pass this to their network layer) when it fires.
   */
  signal: AbortSignal;
}

/**
 * The loading state for a single streamed data source.
 * This is written to the source's status binding in Player's data model,
 * so content can reference it like any other data (e.g. `{{myDataStatus.completed}}`).
 */
export interface StreamingDataStatus {
  /** True once the loader has been asked to start */
  started: boolean;

  /** True while the loader is actively fetching pages */
  loading: boolean;

  /** True once every page has been loaded. False while data is still pending */
  completed: boolean;

  /** The number of pages loaded so far */
  loadedPages: number;

  /** The total number of pages expected, if the loader knows it */
  totalPages?: number;

  /** The number of records loaded so far */
  totalRecords: number;

  /** The failure message if the loader threw an error */
  error?: string;
}

/** The direction used when sorting streamed records */
export type StreamingDataSortDirection = "asc" | "desc";

/** Configuration for a single streamed data source */
export interface StreamingDataSourceConfig<TRecord = unknown> {
  /**
   * The binding the loaded records are exposed under in Player's data model.
   * Reads of this binding (or anything under it) are served from the plugin's
   * in-memory store instead of the regular data model.
   */
  binding: Binding;

  /** The loader implementation responsible for fetching data from a backend */
  loader: StreamingDataLoader<TRecord>;

  /**
   * The binding the pagination status is written to.
   * Defaults to `<binding>Status`.
   * Must not overlap with the data binding.
   */
  statusBinding?: Binding;

  /**
   * When true, loading is deferred until the data binding is first read
   * (for example when a view referencing it is rendered).
   * Defaults to false, which starts loading as soon as the flow starts.
   */
  lazy?: boolean;

  /**
   * When false, records and views handed out by the plugin are not frozen.
   * Defaults to true: the plugin freezes them to guard against accidental mutation,
   * since every consumer shares the same in-memory copy.
   */
  freeze?: boolean;

  /**
   * Custom predicate factory used by the search expression.
   * Defaults to a case-insensitive substring match across the record's own
   * string, number, and boolean properties.
   */
  searchPredicate?: (query: string) => (record: TRecord) => boolean;

  /**
   * Custom comparator factory used by the sort expression.
   * Defaults to a numeric-aware comparison of the given field with missing values last.
   */
  comparator?: (
    field: string,
    direction: StreamingDataSortDirection,
  ) => (a: TRecord, b: TRecord) => number;
}
