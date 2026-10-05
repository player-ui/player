import { describe, expect, test, vi } from "vitest";
import type { InProgressState } from "@player-ui/player";
import { Player } from "@player-ui/player";
import {
  SEARCH_EXPRESSION_NAME,
  SORT_EXPRESSION_NAME,
  StreamingDataPlugin,
  StreamingDataStore,
} from "..";
import type { TransactionRecord } from "./helpers";
import {
  ArrayLoader,
  loadLargeDataSet,
  makeFlow,
  paginate,
  pickNumericField,
} from "./helpers";

/**
 * Performance validation against a large data blob: 50k records (~500 bytes of
 * JSON each, ~28MB serialized, a few hundred MB as live JS objects).
 *
 * Set STREAMING_DATA_FIXTURE to a JSON array file to run against a real
 * backend payload instead of generated data.
 *
 * Thresholds are deliberately generous so slow CI machines don't flake;
 * actual timings are logged for eyeballing regressions. Tighter tracking
 * lives in index.bench.ts.
 */

const RECORD_COUNT = 50000;
const PAGE_SIZE = 500;

const records = loadLargeDataSet(RECORD_COUNT);
const pages = paginate(records, PAGE_SIZE);

// Derive query inputs from the data itself so the same assertions hold for
// generated records and for any fixture supplied via STREAMING_DATA_FIXTURE.
const SORT_FIELD = pickNumericField(records[0] as Record<string, unknown>);
const READ_FIELD = Object.keys(records[0])[0];
const middleRecord = records[Math.floor(records.length / 2)] as Record<
  string,
  unknown
>;
const SEARCH_NEEDLE = String(
  Object.values(middleRecord).find(
    (value) => typeof value === "string" && value.length >= 8,
  ) ?? "quartz",
).toLowerCase();

const time = (fn: () => void): number => {
  const started = performance.now();
  fn();
  return performance.now() - started;
};

/** Start a player streaming the full data set and wait for every page */
const startAndLoadAll = async (): Promise<{
  player: Player;
  state: () => InProgressState;
  plugin: StreamingDataPlugin;
  ingestMs: number;
}> => {
  const plugin = new StreamingDataPlugin({
    binding: "transactions",
    loader: new ArrayLoader(pages),
  });
  const player = new Player({ plugins: [plugin] });

  const started = performance.now();
  player.start(makeFlow());
  const state = () => player.getState() as InProgressState;

  await vi.waitFor(
    () => {
      expect(state().controllers.data.get("transactionsStatus.completed")).toBe(
        true,
      );
    },
    { timeout: 60000, interval: 100 },
  );

  const ingestMs = performance.now() - started;

  return { player, state, plugin, ingestMs };
};

describe(`streaming ${RECORD_COUNT} records through a live player`, () => {
  test("ingests all pages with a rendered view attached in a reasonable time", async () => {
    const { state, ingestMs } = await startAndLoadAll();

    expect(state().controllers.data.get("transactions")).toHaveLength(
      RECORD_COUNT,
    );
    expect(state().controllers.data.get("transactionsStatus")).toMatchObject({
      completed: true,
      loadedPages: pages.length,
      totalPages: pages.length,
      totalRecords: RECORD_COUNT,
    });

    // The live view saw the data land too
    expect(state().controllers.view.currentView?.lastUpdate?.rows).toHaveLength(
      RECORD_COUNT,
    );

    console.log(
      `[perf] ingest ${RECORD_COUNT} records / ${pages.length} pages with live view: ${ingestMs.toFixed(0)}ms`,
    );

    // ~100 pages with a full view re-resolve available per page.
    expect(ingestMs).toBeLessThan(15000);
  }, 120000);

  test("reads stay fast once the data is loaded", async () => {
    const { state } = await startAndLoadAll();
    const data = state().controllers.data;

    // Repeated reads of the whole data set return the cached view
    const fullReadMs = time(() => {
      for (let i = 0; i < 100; i += 1) {
        expect(data.get("transactions")).toHaveLength(RECORD_COUNT);
      }
    });

    // Random row + field access through binding paths
    let hash = 0;
    const randomReadMs = time(() => {
      for (let i = 0; i < 1000; i += 1) {
        const index = (i * 7919) % RECORD_COUNT;
        const value = data.get(`transactions.${index}.${READ_FIELD}`);
        hash += String(value).length;
      }
    });

    expect(hash).toBeGreaterThan(0);

    console.log(
      `[perf] 100 full reads: ${fullReadMs.toFixed(1)}ms, 1000 random field reads: ${randomReadMs.toFixed(1)}ms`,
    );

    expect(fullReadMs).toBeLessThan(500);
    expect(randomReadMs).toBeLessThan(1000);
  }, 120000);

  test("search and sort over the full data set stay interactive", async () => {
    const { state } = await startAndLoadAll();
    const controllers = state().controllers;

    const searchMs = time(() => {
      controllers.expression.evaluate(
        `${SEARCH_EXPRESSION_NAME}("transactions", "${SEARCH_NEEDLE}")`,
      );
    });

    const filtered = controllers.data.get("transactions");
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThanOrEqual(RECORD_COUNT);

    const clearMs = time(() => {
      controllers.expression.evaluate(
        `${SEARCH_EXPRESSION_NAME}("transactions")`,
      );
    });

    const sortMs = time(() => {
      controllers.expression.evaluate(
        `${SORT_EXPRESSION_NAME}("transactions", "${SORT_FIELD}", "desc")`,
      );
    });

    const sorted = controllers.data.get("transactions");
    expect(sorted).toHaveLength(RECORD_COUNT);
    expect(
      Number(sorted[0][SORT_FIELD]) >=
        Number(sorted[RECORD_COUNT - 1][SORT_FIELD]),
    ).toBe(true);

    console.log(
      `[perf] search ('${SEARCH_NEEDLE}', ${filtered.length} hits): ${searchMs.toFixed(1)}ms, clear: ${clearMs.toFixed(1)}ms, sort ('${SORT_FIELD}'): ${sortMs.toFixed(1)}ms`,
    );

    expect(searchMs).toBeLessThan(2000);
    expect(sortMs).toBeLessThan(3000);
  }, 120000);

  test("serialization is unaffected by the streamed blob", async () => {
    const { state } = await startAndLoadAll();

    let serialized: Record<string, unknown> = {};
    const serializeMs = time(() => {
      serialized = state().controllers.data.serialize() as Record<
        string,
        unknown
      >;
    });

    expect(serialized.transactions).toBeUndefined();
    expect(JSON.stringify(serialized).length).toBeLessThan(2000);

    console.log(
      `[perf] serialize with 50k records loaded: ${serializeMs.toFixed(1)}ms`,
    );
    expect(serializeMs).toBeLessThan(250);
  }, 120000);
});

describe("store-level baseline (no player attached)", () => {
  test("ingest, sort, and search directly against the store", () => {
    const store = new StreamingDataStore<TransactionRecord>();

    const ingestMs = time(() => {
      for (const page of pages) {
        store.appendPage(page);
        store.getView();
      }
    });

    expect(store.recordCount).toBe(RECORD_COUNT);

    const sortMs = time(() => {
      store.setSort(SORT_FIELD, "desc");
      expect(store.getView()).toHaveLength(RECORD_COUNT);
    });

    const searchMs = time(() => {
      store.setSearch(SEARCH_NEEDLE);
      expect(store.getView().length).toBeGreaterThan(0);
    });

    console.log(
      `[perf] store-only ingest (view rebuilt per page): ${ingestMs.toFixed(0)}ms, sort: ${sortMs.toFixed(1)}ms, search: ${searchMs.toFixed(1)}ms`,
    );

    expect(ingestMs).toBeLessThan(5000);
    expect(sortMs).toBeLessThan(2000);
    expect(searchMs).toBeLessThan(1000);
  }, 60000);
});
