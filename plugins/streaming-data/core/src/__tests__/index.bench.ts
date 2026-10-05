import { bench, describe } from "vitest";
import type { InProgressState } from "@player-ui/player";
import { Player } from "@player-ui/player";
import { StreamingDataPlugin, StreamingDataStore } from "..";
import type { TransactionRecord } from "./helpers";
import { ArrayLoader, generateRecords, makeFlow, paginate } from "./helpers";

// Benchmarks for the streaming-data plugin against large data sets.
// Generated data is used (not the fixture env var) so results are stable
// across machines and comparable against benchmarks/baseline.json.

const SIZES = [10000, 50000];

describe("store operations", () => {
  SIZES.forEach((size) => {
    const records = generateRecords(size);
    const pages = paginate(records, 500);

    bench(
      `ingest ${size} records in 500-record pages (view rebuilt per page)`,
      () => {
        const store = new StreamingDataStore<TransactionRecord>();

        for (const page of pages) {
          store.appendPage(page);
          store.getView();
        }
      },
    );

    const loadedStore = new StreamingDataStore<TransactionRecord>();
    loadedStore.appendPage(records);

    bench(`sort ${size} records on a numeric string field`, () => {
      loadedStore.setSort("amount", "desc");
      loadedStore.getView();
      loadedStore.setSort(undefined);
    });

    bench(`search ${size} records for a substring`, () => {
      loadedStore.setSearch("quartz");
      loadedStore.getView();
      loadedStore.setSearch(undefined);
    });
  });
});

describe("player integration", () => {
  SIZES.forEach((size) => {
    let state: InProgressState;

    const setupPlayer = async (): Promise<void> => {
      const plugin = new StreamingDataPlugin({
        binding: "transactions",
        loader: new ArrayLoader(paginate(generateRecords(size), 500)),
      });
      const player = new Player({ plugins: [plugin] });
      player.start(makeFlow());
      state = player.getState() as InProgressState;

      while (
        state.controllers.data.get("transactionsStatus.completed") !== true
      ) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    };

    bench(
      `stream ${size} records through player with a live view`,
      async () => {
        await setupPlayer();
      },
      { iterations: 5, warmupIterations: 1, throws: true },
    );

    bench(
      `random field reads with ${size} records loaded`,
      () => {
        for (let i = 0; i < 100; i += 1) {
          state.controllers.data.get(`transactions.${(i * 7919) % size}.id`);
        }
      },
      {
        setup: (task) => {
          task.opts.beforeAll = async () => {
            await setupPlayer();
          };
        },
        throws: true,
      },
    );
  });
});
