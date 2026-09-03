import * as fs from "node:fs";
import type { Flow } from "@player-ui/player";
import type {
  PagedDataResult,
  StreamingDataLoadContext,
  StreamingDataPage,
} from "..";
import { PagedStreamingDataLoader, StreamingDataLoader } from "..";

/**
 * A generic ledger-style record used for tests and benchmarks.
 * The shape (mostly-string fields, numeric strings, dates, enums, ~500 bytes
 * of JSON per record) matches what large backend exports tend to look like,
 * without mirroring any real payload's schema.
 */
export interface TransactionRecord {
  /** Unique id for the record */
  id: string;

  /** Display name, built from random word pools */
  description: string;

  /** Category enum */
  category: string;

  /** Dollar amount, serialized as a numeric string */
  amount: string;

  /** Fee amount, serialized as a numeric string. Fuzzed to be occasionally absent */
  fee?: string;

  /** Unit count */
  quantity: number;

  /** ISO date the position was opened */
  acquiredDate: string;

  /** ISO date the position was settled */
  settledDate: string;

  /** Holding-period enum */
  term: string;

  /** Workflow status enum */
  status: string;

  /** Whether the record needs user review */
  needsReview: boolean;

  /** Free-form filler text of fuzzed length */
  notes: string;
}

// "quartz" only ever appears in descriptions, making search assertions easy
const DESCRIPTION_LEADS = [
  "Quartz",
  "Harbor",
  "Willow",
  "Summit",
  "Meadow",
  "Juniper",
];
const DESCRIPTION_TAILS = [
  "Holdings",
  "Ventures",
  "Partners",
  "Industries",
  "Group",
  "Trust",
];
const CATEGORIES = ["equity", "fund", "bond", "crypto", "cash"];
const STATUSES = ["complete", "incomplete", "review"];
const NOTE_WORDS = [
  "pending",
  "statement",
  "reconciled",
  "imported",
  "adjusted",
  "verified",
  "carryover",
  "estimated",
  "flagged",
  "archived",
];

/** A tiny deterministic PRNG so generated data is stable across runs */
const lcg = (seed: number): (() => number) => {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
};

/** Generate fuzzed records (deterministic for a given seed) */
export const generateRecords = (
  count: number,
  seed = 42,
): Array<TransactionRecord> => {
  const random = lcg(seed);
  const records: Array<TransactionRecord> = [];

  for (let i = 0; i < count; i += 1) {
    const noteLength = Math.floor(random() * 12);
    const notes = Array.from(
      { length: noteLength },
      () => NOTE_WORDS[Math.floor(random() * NOTE_WORDS.length)],
    ).join(" ");

    const record: TransactionRecord = {
      id: `${Math.floor(random() * 0xffffffff)
        .toString(16)
        .padStart(8, "0")}-${i.toString(16).padStart(10, "0")}`,
      description: `${
        DESCRIPTION_LEADS[Math.floor(random() * DESCRIPTION_LEADS.length)]
      } ${DESCRIPTION_TAILS[Math.floor(random() * DESCRIPTION_TAILS.length)]} ${
        1 + Math.floor(random() * 400)
      }`,
      category: CATEGORIES[Math.floor(random() * CATEGORIES.length)],
      amount: (Math.round(random() * 500000) / 100).toFixed(2),
      quantity: 1 + Math.floor(random() * 2000),
      acquiredDate: `201${Math.floor(random() * 9)}-0${
        1 + Math.floor(random() * 9)
      }-1${Math.floor(random() * 9)}`,
      settledDate: `2023-0${1 + Math.floor(random() * 9)}-0${
        1 + Math.floor(random() * 9)
      }`,
      term: random() > 0.4 ? "LONG" : "SHORT",
      status: STATUSES[Math.floor(random() * STATUSES.length)],
      needsReview: random() > 0.9,
      notes,
    };

    // fuzz: a small slice of records is missing the fee entirely
    if (random() > 0.02) {
      record.fee = (Math.round(random() * 5000) / 100).toFixed(2);
    }

    records.push(record);
  }

  return records;
};

/**
 * Load a real data set when STREAMING_DATA_FIXTURE points at a JSON array file
 * (kept out of the repo), falling back to generated records.
 */
export const loadLargeDataSet = (count = 50000): Array<TransactionRecord> => {
  const fixturePath = process.env.STREAMING_DATA_FIXTURE;

  if (fixturePath && fs.existsSync(fixturePath)) {
    const records = JSON.parse(
      fs.readFileSync(fixturePath, "utf-8"),
    ) as Array<TransactionRecord>;

    return records.slice(0, count);
  }

  return generateRecords(count);
};

/** Find a field on the sample record whose values are numeric strings, for sorting */
export const pickNumericField = (sample: Record<string, unknown>): string => {
  const entry = Object.entries(sample).find(
    ([, value]) =>
      typeof value === "string" && value !== "" && !Number.isNaN(Number(value)),
  );

  return entry?.[0] ?? "amount";
};

/** Split records into evenly sized pages */
export const paginate = <TRecord>(
  records: Array<TRecord>,
  pageSize: number,
): Array<Array<TRecord>> => {
  const pages: Array<Array<TRecord>> = [];

  for (let i = 0; i < records.length; i += pageSize) {
    pages.push(records.slice(i, i + pageSize));
  }

  return pages;
};

/** A loader that serves a pre-paginated in-memory data set */
export class ArrayLoader<TRecord> extends PagedStreamingDataLoader<TRecord> {
  public fetchCount = 0;

  constructor(private pages: Array<Array<TRecord>>) {
    super();
  }

  protected async fetchPage(
    pageIndex: number,
  ): Promise<PagedDataResult<TRecord>> {
    this.fetchCount += 1;

    return {
      records: this.pages[pageIndex] ?? [],
      totalPages: this.pages.length,
    };
  }
}

const DONE = Symbol("done");

/** A loader driven from the outside, for stepwise pagination tests */
export class ManualLoader<TRecord> extends StreamingDataLoader<TRecord> {
  public lastContext?: StreamingDataLoadContext;

  private queue: Array<StreamingDataPage<TRecord> | typeof DONE | Error> = [];
  private wake?: () => void;

  /** Deliver one page to the plugin */
  public emit(page: StreamingDataPage<TRecord>): void {
    this.queue.push(page);
    this.wake?.();
  }

  /** Finish the stream */
  public complete(): void {
    this.queue.push(DONE);
    this.wake?.();
  }

  /** Fail the stream */
  public fail(error: Error): void {
    this.queue.push(error);
    this.wake?.();
  }

  public async *load(
    context: StreamingDataLoadContext,
  ): AsyncIterable<StreamingDataPage<TRecord>> {
    this.lastContext = context;

    for (;;) {
      while (this.queue.length === 0) {
        await new Promise<void>((resolve) => {
          this.wake = resolve;
        });
      }

      const item = this.queue.shift();

      if (item === DONE) {
        return;
      }

      if (item instanceof Error) {
        throw item;
      }

      if (item !== undefined) {
        yield item;
      }
    }
  }
}

/** A single-view flow that renders streamed records and their status */
export const makeFlow = (binding = "transactions"): Flow => ({
  id: "streaming-data-flow",
  views: [
    {
      id: "view-1",
      type: "info",
      rows: `{{${binding}}}`,
      rowCount: `{{${binding}Status.totalRecords}}`,
      loadedPages: `{{${binding}Status.loadedPages}}`,
      completed: `{{${binding}Status.completed}}`,
    },
  ],
  data: {},
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          "*": "END_done",
        },
      },
      END_done: {
        state_type: "END",
        outcome: "done",
      },
    },
  },
});
