import { describe, expect, test, vi } from "vitest";
import type { InProgressState } from "@player-ui/player";
import { Player } from "@player-ui/player";
import {
  CLEAR_QUERY_EXPRESSION_NAME,
  SEARCH_EXPRESSION_NAME,
  SORT_EXPRESSION_NAME,
  StreamingDataPlugin,
} from "..";
import type { TransactionRecord } from "./helpers";
import {
  ArrayLoader,
  ManualLoader,
  generateRecords,
  makeFlow,
  paginate,
} from "./helpers";

const start = (
  plugin: StreamingDataPlugin,
  flow = makeFlow(),
): { player: Player; state: () => InProgressState } => {
  const player = new Player({ plugins: [plugin] });
  player.start(flow);

  return {
    player,
    state: () => player.getState() as InProgressState,
  };
};

describe("data loading", () => {
  test("exposes streamed records through the data model and the resolved view", async () => {
    const records = generateRecords(9);
    const loader = new ArrayLoader(paginate(records, 3));
    const plugin = new StreamingDataPlugin({ binding: "transactions", loader });
    const { state } = start(plugin);

    await vi.waitFor(() => {
      expect(state().controllers.data.get("transactionsStatus.completed")).toBe(
        true,
      );
    });

    const controllers = state().controllers;

    // Whole data set, one record, one field, and array length all resolve
    expect(controllers.data.get("transactions")).toHaveLength(9);
    expect(controllers.data.get("transactions.4")).toStrictEqual(records[4]);
    expect(controllers.data.get("transactions.4.id")).toBe(records[4].id);
    expect(controllers.data.get("transactions.length")).toBe(9);

    // The view resolved the records and status
    const lastUpdate = controllers.view.currentView?.lastUpdate;
    expect(lastUpdate?.rows).toHaveLength(9);
    expect(lastUpdate?.rowCount).toBe(9);
    expect(lastUpdate?.completed).toBe(true);
  });

  test("tracks pagination status while pages load", async () => {
    const loader = new ManualLoader<TransactionRecord>();
    const plugin = new StreamingDataPlugin({ binding: "transactions", loader });
    const { state } = start(plugin);

    const status = () => state().controllers.data.get("transactionsStatus");

    await vi.waitFor(() => {
      expect(status()).toMatchObject({
        started: true,
        loading: true,
        completed: false,
        loadedPages: 0,
        totalRecords: 0,
      });
    });

    loader.emit({ records: generateRecords(2), totalPages: 3 });

    await vi.waitFor(() => {
      expect(status()).toMatchObject({
        loadedPages: 1,
        totalPages: 3,
        totalRecords: 2,
        completed: false,
      });
    });

    loader.emit({ records: generateRecords(2), totalPages: 3 });
    loader.emit({ records: generateRecords(2), totalPages: 3 });
    loader.complete();

    await vi.waitFor(() => {
      expect(status()).toMatchObject({
        loadedPages: 3,
        totalPages: 3,
        totalRecords: 6,
        completed: true,
        loading: false,
      });
    });
  });

  test("the view updates as pages arrive", async () => {
    const loader = new ManualLoader<TransactionRecord>();
    const plugin = new StreamingDataPlugin({ binding: "transactions", loader });
    const player = new Player({ plugins: [plugin] });

    const rowCounts: Array<number> = [];
    player.hooks.view.tap("test", (view) => {
      view.hooks.onUpdate.tap("test", (update) => {
        rowCounts.push(update.rows?.length ?? 0);
      });
    });

    player.start(makeFlow());

    loader.emit({ records: generateRecords(5), totalPages: 2 });
    await vi.waitFor(() => {
      expect(rowCounts.at(-1)).toBe(5);
    });

    loader.emit({ records: generateRecords(5), totalPages: 2 });
    loader.complete();
    await vi.waitFor(() => {
      expect(rowCounts.at(-1)).toBe(10);
    });

    // Updates only ever grow the row count (no flicker back to empty)
    expect([...rowCounts]).toStrictEqual([...rowCounts].sort((a, b) => a - b));
  });

  test("lazy sources only load once the data binding is read", async () => {
    const loader = new ArrayLoader(paginate(generateRecords(4), 2));
    const plugin = new StreamingDataPlugin({
      binding: "transactions",
      loader,
      lazy: true,
    });

    // The flow's view never references the streamed binding
    const flow = makeFlow();
    flow.views = [{ id: "view-1", type: "info" }];

    const { state } = start(plugin, flow);

    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(loader.fetchCount).toBe(0);

    // First read triggers the load
    expect(state().controllers.data.get("transactions")).toStrictEqual([]);

    await vi.waitFor(() => {
      expect(state().controllers.data.get("transactionsStatus.completed")).toBe(
        true,
      );
    });

    expect(state().controllers.data.get("transactions")).toHaveLength(4);
  });

  test("loader failures surface on the status binding without crashing the flow", async () => {
    const loader = new ManualLoader<TransactionRecord>();
    const plugin = new StreamingDataPlugin({ binding: "transactions", loader });
    const { player, state } = start(plugin);

    loader.emit({ records: generateRecords(2) });
    loader.fail(new Error("backend exploded"));

    await vi.waitFor(() => {
      expect(state().controllers.data.get("transactionsStatus")).toMatchObject({
        loading: false,
        completed: false,
        error: "backend exploded",
      });
    });

    // Already-loaded pages are still available and the flow is still running
    expect(state().controllers.data.get("transactions")).toHaveLength(2);
    expect(player.getState().status).toBe("in-progress");
  });

  test("aborts in-flight loading when the flow ends", async () => {
    const loader = new ManualLoader<TransactionRecord>();
    const plugin = new StreamingDataPlugin({ binding: "transactions", loader });
    const { state } = start(plugin);

    loader.emit({ records: generateRecords(2), totalPages: 100 });

    await vi.waitFor(() => {
      expect(loader.lastContext).toBeDefined();
      expect(
        state().controllers.data.get("transactionsStatus.loadedPages"),
      ).toBe(1);
    });

    expect(loader.lastContext?.signal.aborted).toBe(false);
    state().controllers.flow.transition("next");

    await vi.waitFor(() => {
      expect(loader.lastContext?.signal.aborted).toBe(true);
    });
  });
});

describe("data protection", () => {
  test("streamed data is read-only through the data model", async () => {
    const records = generateRecords(4);
    const loader = new ArrayLoader(paginate(records, 2));
    const plugin = new StreamingDataPlugin({ binding: "transactions", loader });
    const { state } = start(plugin);

    await vi.waitFor(() => {
      expect(state().controllers.data.get("transactionsStatus.completed")).toBe(
        true,
      );
    });

    const data = state().controllers.data;

    data.set([["transactions.0.id", "tampered"]]);
    expect(data.get("transactions.0.id")).toBe(records[0].id);

    data.set([["transactions", []]]);
    expect(data.get("transactions")).toHaveLength(4);

    data.delete("transactions.1");
    expect(data.get("transactions")).toHaveLength(4);

    // Writes outside the streamed binding still work
    data.set([["someOtherValue", "kept"]]);
    expect(data.get("someOtherValue")).toBe("kept");
  });

  test("streamed data stays out of the serialized data model", async () => {
    const loader = new ArrayLoader(paginate(generateRecords(6), 2));
    const plugin = new StreamingDataPlugin({ binding: "transactions", loader });
    const { state } = start(plugin);

    await vi.waitFor(() => {
      expect(state().controllers.data.get("transactionsStatus.completed")).toBe(
        true,
      );
    });

    const serialized = state().controllers.data.serialize() as Record<
      string,
      unknown
    >;

    expect(serialized.transactions).toBeUndefined();
    expect(serialized.transactionsStatus).toMatchObject({
      completed: true,
      totalRecords: 6,
    });
  });

  test("records handed out by the plugin are frozen by default", async () => {
    const loader = new ArrayLoader(paginate(generateRecords(2), 2));
    const plugin = new StreamingDataPlugin({ binding: "transactions", loader });
    const { state } = start(plugin);

    await vi.waitFor(() => {
      expect(state().controllers.data.get("transactionsStatus.completed")).toBe(
        true,
      );
    });

    const rows = state().controllers.data.get("transactions");
    expect(Object.isFrozen(rows)).toBe(true);
    expect(Object.isFrozen(rows[0])).toBe(true);
  });
});

describe("querying", () => {
  const startWithRecords = async (records: Array<TransactionRecord>) => {
    const loader = new ArrayLoader(paginate(records, 500));
    const plugin = new StreamingDataPlugin({ binding: "transactions", loader });
    const started = start(plugin);

    await vi.waitFor(() => {
      expect(
        started.state().controllers.data.get("transactionsStatus.completed"),
      ).toBe(true);
    });

    return started;
  };

  test("sorts through the sort expression", async () => {
    const records = generateRecords(1000);
    const { state } = await startWithRecords(records);

    state().controllers.expression.evaluate(
      `${SORT_EXPRESSION_NAME}("transactions", "amount", "desc")`,
    );

    const sorted = state().controllers.data.get("transactions");
    const expectedMax = Math.max(
      ...records.map((record) => Number(record.amount)),
    );

    expect(sorted).toHaveLength(1000);
    expect(Number(sorted[0].amount)).toBe(expectedMax);
    expect(Number(sorted[0].amount) >= Number(sorted[999].amount)).toBe(true);

    // Flipping direction reverses the order
    state().controllers.expression.evaluate(
      `${SORT_EXPRESSION_NAME}("transactions", "amount", "asc")`,
    );
    expect(Number(state().controllers.data.get("transactions.0.amount"))).toBe(
      Math.min(...records.map((r) => Number(r.amount))),
    );
  });

  test("filters through the search expression and clears back to the full set", async () => {
    const records = generateRecords(1000);
    const { state } = await startWithRecords(records);

    const expected = records.filter((record) =>
      Object.values(record).some(
        (value) =>
          typeof value === "string" && value.toLowerCase().includes("quartz"),
      ),
    );

    state().controllers.expression.evaluate(
      `${SEARCH_EXPRESSION_NAME}("transactions", "quartz")`,
    );

    expect(state().controllers.data.get("transactions")).toHaveLength(
      expected.length,
    );
    expect(
      state().controllers.data.get("transactionsStatus.totalRecords"),
    ).toBe(1000);

    state().controllers.expression.evaluate(
      `${CLEAR_QUERY_EXPRESSION_NAME}("transactions")`,
    );

    expect(state().controllers.data.get("transactions")).toHaveLength(1000);
  });

  test("expression arguments can be model refs (search box pattern)", async () => {
    const records = generateRecords(1000);
    const { state } = await startWithRecords(records);

    // An input asset writes the query to a binding, and an action evaluates
    // the search expression with that binding as the argument
    state().controllers.data.set([["searchQuery", "quartz"]]);
    state().controllers.expression.evaluate(
      `${SEARCH_EXPRESSION_NAME}("transactions", {{searchQuery}})`,
    );

    const filtered = state().controllers.data.get("transactions");
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.length).toBeLessThan(1000);

    // Clearing the bound query and re-running restores the full set
    state().controllers.data.set([["searchQuery", ""]]);
    state().controllers.expression.evaluate(
      `${SEARCH_EXPRESSION_NAME}("transactions", {{searchQuery}})`,
    );
    expect(state().controllers.data.get("transactions")).toHaveLength(1000);
  });

  test("search and sort compose, and the view re-resolves when they change", async () => {
    const records = generateRecords(1000);
    const { state } = await startWithRecords(records);

    const lastUpdate = () => state().controllers.view.currentView?.lastUpdate;
    const fullLength = lastUpdate()?.rows.length;
    expect(fullLength).toBe(1000);

    state().controllers.expression.evaluate(
      `${SEARCH_EXPRESSION_NAME}("transactions", "quartz")`,
    );
    state().controllers.expression.evaluate(
      `${SORT_EXPRESSION_NAME}("transactions", "amount", "desc")`,
    );

    await vi.waitFor(() => {
      const rows = lastUpdate()?.rows;
      expect(rows.length).toBeLessThan(1000);
      expect(rows.length).toBeGreaterThan(0);
      expect(
        Number(rows[0].amount) >= Number(rows[rows.length - 1].amount),
      ).toBe(true);
      expect(
        rows.every((row: TransactionRecord) =>
          row.description.toLowerCase().includes("quartz"),
        ),
      ).toBe(true);
    });
  });

  test("querying an unknown binding warns instead of throwing", async () => {
    const { state } = await startWithRecords(generateRecords(10));

    expect(() =>
      state().controllers.expression.evaluate(
        `${SORT_EXPRESSION_NAME}("unknownBinding", "id")`,
      ),
    ).not.toThrow();

    expect(state().controllers.data.get("transactions")).toHaveLength(10);
  });
});

describe("multiple sources", () => {
  test("sources load and query independently", async () => {
    const transactionLoader = new ArrayLoader(paginate(generateRecords(10), 5));
    const accounts = [
      { id: "acct-1", name: "Brokerage" },
      { id: "acct-2", name: "Retirement" },
    ];
    const accountLoader = new ArrayLoader([accounts]);

    const plugin = new StreamingDataPlugin([
      { binding: "transactions", loader: transactionLoader },
      { binding: "accounts", loader: accountLoader },
    ]);

    const { state } = start(plugin);

    await vi.waitFor(() => {
      expect(state().controllers.data.get("transactionsStatus.completed")).toBe(
        true,
      );
      expect(state().controllers.data.get("accountsStatus.completed")).toBe(
        true,
      );
    });

    state().controllers.expression.evaluate(
      `${SEARCH_EXPRESSION_NAME}("accounts", "retirement")`,
    );

    expect(state().controllers.data.get("accounts")).toHaveLength(1);
    expect(state().controllers.data.get("transactions")).toHaveLength(10);
  });
});

describe("configuration validation", () => {
  const noopLoader = new ArrayLoader<TransactionRecord>([]);

  test("rejects overlapping bindings", () => {
    expect(
      () =>
        new StreamingDataPlugin([
          { binding: "data.foo", loader: noopLoader },
          { binding: "data.foo.bar", loader: noopLoader },
        ]),
    ).toThrowError(/must not overlap/);

    expect(
      () =>
        new StreamingDataPlugin({
          binding: "data.foo",
          loader: noopLoader,
          statusBinding: "data.foo.status",
        }),
    ).toThrowError(/must not overlap/);
  });

  test("rejects empty configuration", () => {
    expect(() => new StreamingDataPlugin([])).toThrowError(
      /at least one source/,
    );
    expect(
      () => new StreamingDataPlugin({ binding: "", loader: noopLoader }),
    ).toThrowError(/non-empty binding/);
  });
});
