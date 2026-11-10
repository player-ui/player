import type {
  CollectionChange,
  CollectionHandle,
  CommitOutcome,
} from "./types";

type Listener<R> = (change: CollectionChange<R>) => void;

/** What a merge changed */
export interface MergeSummary {
  /** Where the replaced records are, in the list as it was before any removal */
  updatedIndexes: number[];
  appended: number;
  removed: number;
}

// Spreading a very large batch into push() overflows the argument limit.
const PUSH_CHUNK = 10_000;

/**
 * The records of one collection, held once, frozen, and indexed by key. Changes made in place keep
 * the same array, so a consumer holding it sees them; every change is announced to subscribers.
 */
export class RecordCollection<R extends object> implements CollectionHandle<R> {
  readonly binding: string;

  readonly statusBinding: string;

  private readonly keyOf: (record: R) => string;

  private list: R[] = [];

  private positions = new Map<string, number>();

  private readonly listeners = new Set<Listener<R>>();

  constructor(
    binding: string,
    statusBinding: string,
    keyOf: (record: R) => string,
  ) {
    this.binding = binding;
    this.statusBinding = statusBinding;
    this.keyOf = keyOf;
  }

  get records(): ReadonlyArray<R> {
    return this.list;
  }

  key(record: R): string {
    return this.keyOf(record);
  }

  indexOf(key: string): number {
    return this.positions.get(key) ?? -1;
  }

  get(key: string): R | undefined {
    const index = this.positions.get(key);
    return index === undefined ? undefined : this.list[index];
  }

  subscribe(listener: Listener<R>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Adds a batch of loaded records; a record whose key is already held replaces that one */
  append(records: ReadonlyArray<R>): MergeSummary {
    return this.merge(records, []);
  }

  /**
   * Replaces held records by key, in place, adds records with new keys at the end, and drops the
   * removed keys. Announces each kind of change that happened.
   */
  merge(
    records: ReadonlyArray<R>,
    removed: ReadonlyArray<string>,
  ): MergeSummary {
    const updated: R[] = [];
    const updatedIndexes: number[] = [];
    const added: R[] = [];

    records.forEach((record) => {
      Object.freeze(record);
      const index = this.positions.get(this.keyOf(record));
      if (index === undefined) {
        added.push(record);
      } else {
        this.list[index] = record;
        updated.push(record);
        updatedIndexes.push(index);
      }
    });

    for (let start = 0; start < added.length; start += PUSH_CHUNK) {
      const first = this.list.length;
      const chunk = added.slice(start, start + PUSH_CHUNK);
      this.list.push(...chunk);
      chunk.forEach((record, offset) =>
        this.positions.set(this.keyOf(record), first + offset),
      );
    }

    const gone = removed.filter((key) => this.positions.has(key));
    if (gone.length > 0) this.drop(new Set(gone));

    if (updated.length > 0) this.emit({ type: "updated", records: updated });
    if (added.length > 0) this.emit({ type: "appended", records: added });
    if (gone.length > 0) this.emit({ type: "removed", keys: gone });
    return { updatedIndexes, appended: added.length, removed: gone.length };
  }

  /** Drops every record, before a new load replaces them */
  clear(): void {
    this.list = [];
    this.positions = new Map();
    this.emit({ type: "reset" });
  }

  /** Announces that a save which changed records has been merged */
  committed(outcome: CommitOutcome): void {
    this.emit({ type: "committed", outcome });
  }

  private drop(keys: ReadonlySet<string>): void {
    this.list = this.list.filter((record) => !keys.has(this.keyOf(record)));
    this.positions = new Map(
      this.list.map((record, index) => [this.keyOf(record), index]),
    );
  }

  private emit(change: CollectionChange<R>): void {
    this.listeners.forEach((listener) => listener(change));
  }
}
