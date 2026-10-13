import type {
  StreamingDataSortDirection,
  StreamingDataSourceConfig,
} from "./types";

/** The active sort applied to a store's view */
export interface StreamingDataSort {
  /** The record field to sort by */
  field: string;

  /** The direction to sort in */
  direction: StreamingDataSortDirection;
}

/** The query (search + sort) currently applied to a store's view */
export interface StreamingDataQuery {
  /** The active sort, if any */
  sort?: StreamingDataSort;

  /** The active search query, if any */
  search?: string;
}

/**
 * The default comparator: numeric-aware comparison of a single field.
 * Values that parse as numbers compare numerically, everything else compares
 * as strings. Missing values always sort last regardless of direction.
 */
const defaultComparator = <TRecord>(
  field: string,
  direction: StreamingDataSortDirection,
): ((a: TRecord, b: TRecord) => number) => {
  const dir = direction === "desc" ? -1 : 1;

  return (a: TRecord, b: TRecord): number => {
    const aVal = (a as Record<string, unknown>)?.[field];
    const bVal = (b as Record<string, unknown>)?.[field];

    if (aVal === bVal) {
      return 0;
    }

    if (aVal === undefined || aVal === null) {
      return 1;
    }

    if (bVal === undefined || bVal === null) {
      return -1;
    }

    if (typeof aVal === "number" && typeof bVal === "number") {
      return (aVal - bVal) * dir;
    }

    const aNum = Number(aVal);
    const bNum = Number(bVal);

    if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
      return (aNum - bNum) * dir;
    }

    const aStr = String(aVal);
    const bStr = String(bVal);

    if (aStr < bStr) {
      return -dir;
    }

    return aStr > bStr ? dir : 0;
  };
};

/**
 * The default search predicate: case-insensitive substring match across the
 * record's own string, number, and boolean properties.
 */
const defaultSearchPredicate = <TRecord>(
  query: string,
): ((record: TRecord) => boolean) => {
  const normalized = query.toLowerCase();

  return (record: TRecord): boolean => {
    if (record === undefined || record === null) {
      return false;
    }

    if (typeof record !== "object") {
      return String(record).toLowerCase().includes(normalized);
    }

    for (const value of Object.values(record)) {
      if (typeof value === "string") {
        if (value.toLowerCase().includes(normalized)) {
          return true;
        }
      } else if (
        (typeof value === "number" || typeof value === "boolean") &&
        String(value).includes(normalized)
      ) {
        return true;
      }
    }

    return false;
  };
};

/**
 * The in-memory store backing one streamed data source.
 *
 * Records live here instead of Player's data model so that a 200MB payload is
 * held once, is never deep-copied into the model, and can't be mutated through
 * normal data-model writes. The store exposes a derived "view" (search + sort
 * applied) that the plugin serves for data-model reads. The view is cached and
 * only rebuilt when records are appended or the query changes; each rebuild is
 * a new array identity so Player's dirty-checking sees the change.
 */
export class StreamingDataStore<TRecord = unknown> {
  private records: Array<TRecord> = [];
  private view?: ReadonlyArray<TRecord>;
  private currentRevision = 0;
  private query: StreamingDataQuery = {};

  constructor(
    private options: Pick<
      StreamingDataSourceConfig<TRecord>,
      "searchPredicate" | "comparator" | "freeze"
    > = {},
  ) {}

  /** A counter that increments whenever the derived view changes */
  public get revision(): number {
    return this.currentRevision;
  }

  /** The number of records loaded, ignoring any active search */
  public get recordCount(): number {
    return this.records.length;
  }

  /** The query currently applied to the view */
  public getQuery(): StreamingDataQuery {
    return { ...this.query };
  }

  /** Append a page of records and invalidate the derived view */
  public appendPage(records: Array<TRecord>): void {
    if (records.length === 0) {
      return;
    }

    if (this.options.freeze !== false) {
      for (const record of records) {
        if (typeof record === "object" && record !== null) {
          Object.freeze(record);
        }
      }
    }

    // push in chunks to avoid argument-spread limits on very large pages
    for (let i = 0; i < records.length; i += 10000) {
      this.records.push(...records.slice(i, i + 10000));
    }

    this.invalidate();
  }

  /**
   * Set (or clear, when `field` is omitted) the sort applied to the view.
   * Returns true if this changed the view.
   */
  public setSort(
    field?: string,
    direction: StreamingDataSortDirection = "asc",
  ): boolean {
    const current = this.query.sort;

    if (field === undefined || field === "") {
      if (current === undefined) {
        return false;
      }

      this.query.sort = undefined;
      this.invalidate();
      return true;
    }

    if (current?.field === field && current.direction === direction) {
      return false;
    }

    this.query.sort = { field, direction };
    this.invalidate();
    return true;
  }

  /**
   * Set (or clear, when `query` is omitted or empty) the search applied to the view.
   * Returns true if this changed the view.
   */
  public setSearch(query?: string): boolean {
    const normalized = query === "" ? undefined : query;

    if (this.query.search === normalized) {
      return false;
    }

    this.query.search = normalized;
    this.invalidate();
    return true;
  }

  /** Clear both search and sort. Returns true if this changed the view */
  public clearQuery(): boolean {
    const changedSearch = this.setSearch(undefined);
    const changedSort = this.setSort(undefined);
    return changedSearch || changedSort;
  }

  /**
   * The records with the current query applied.
   * The result is cached: repeated reads between changes return the same array.
   */
  public getView(): ReadonlyArray<TRecord> {
    if (this.view === undefined) {
      this.view = this.buildView();
    }

    return this.view;
  }

  /** Drop all records and reset the query */
  public reset(): void {
    this.records = [];
    this.query = {};
    this.invalidate();
  }

  private invalidate(): void {
    this.view = undefined;
    this.currentRevision += 1;
  }

  private buildView(): ReadonlyArray<TRecord> {
    const { search, sort } = this.query;
    let view: Array<TRecord>;

    if (search === undefined) {
      view = this.records.slice();
    } else {
      const predicate = (
        this.options.searchPredicate ?? defaultSearchPredicate
      )(search);
      view = this.records.filter(predicate);
    }

    if (sort) {
      const comparator = (this.options.comparator ?? defaultComparator)(
        sort.field,
        sort.direction,
      );
      view.sort(comparator);
    }

    return this.options.freeze === false ? view : Object.freeze(view);
  }
}
