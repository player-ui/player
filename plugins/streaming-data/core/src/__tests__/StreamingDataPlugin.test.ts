import { describe, it, expect, vitest } from "vitest";
import { Player } from "@player-ui/player";
import type { Flow, Logger, PlayerPlugin } from "@player-ui/player";
import { ExternalStatePlugin } from "@player-ui/external-state-plugin";
import { StreamingDataPlugin } from "..";
import type {
  CommitResult,
  RecordBatch,
  RecordChanges,
  RecordSource,
  SourceContext,
} from "..";

interface Item {
  id: string;
  name: string;
}

const item = (id: string, name = id.toUpperCase()): Item => ({ id, name });

const RETURNS = {
  saved: "VIEW_main",
  partial: "VIEW_main",
  failed: "VIEW_main",
};

const flow: Flow = {
  id: "streaming-data-test",
  views: [
    {
      id: "main",
      type: "info",
      saving: {
        asset: {
          id: "saving",
          type: "text",
          value: "Saving: {{itemsStatus.committing}}",
        },
      },
    },
    { id: "form", type: "info" },
  ],
  schema: {
    ROOT: {
      items: {
        type: "ItemType",
        isArray: true,
        source: {
          ref: "items",
          status: "itemsStatus",
          params: { group: "{{group}}" },
        },
      },
    },
    ItemType: { id: { type: "StringType" }, name: { type: "StringType" } },
  },
  data: { group: "g1" },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_main",
      VIEW_main: {
        state_type: "VIEW",
        ref: "main",
        transitions: {
          Rename: "EXTERNAL_rename",
          Remove: "EXTERNAL_remove",
          Misplaced: "EXTERNAL_misplaced",
          Form: "VIEW_form",
          Done: "END_done",
        },
      },
      VIEW_form: {
        state_type: "VIEW",
        ref: "form",
        attributes: { overlay: true },
        transitions: { Rename: "EXTERNAL_rename" },
      },
      EXTERNAL_rename: {
        state_type: "EXTERNAL",
        ref: "commit-records",
        param: { binding: "items", update: "selected", rowBinding: "row" },
        eachRow: ["{{row.name}} = 'renamed'"],
        transitions: RETURNS,
      },
      EXTERNAL_remove: {
        state_type: "EXTERNAL",
        ref: "commit-records",
        param: { binding: "items", remove: "selected" },
        transitions: RETURNS,
      },
      EXTERNAL_misplaced: {
        state_type: "EXTERNAL",
        ref: "commit-records",
        param: {
          binding: "items",
          update: "selected",
          rowBinding: "row",
          eachRow: ["{{row.name}} = 'renamed'"],
        },
        transitions: RETURNS,
      },
      END_done: { state_type: "END", outcome: "done" },
    },
  },
};

/** Saves every change it's given */
const saveAll = (changes: RecordChanges<Item>): CommitResult<Item> => ({
  records: changes.update.map(({ record }) => record),
  removed: changes.remove,
  failed: [],
});

/** A source whose batches, failures, and saves the test controls */
const feed = (
  commitWith: ((changes: RecordChanges<Item>) => CommitResult<Item>) | null,
) => {
  const queue: Array<RecordBatch<Item> | Error | "end"> = [];
  let wake: (() => void) | undefined;
  const loads: SourceContext[] = [];
  const commits: Array<RecordChanges<Item>> = [];
  let held: Promise<void> | undefined;

  const send = (next: RecordBatch<Item> | Error | "end") => {
    queue.push(next);
    wake?.();
    wake = undefined;
  };
  const nextSent = () =>
    new Promise<void>((resolve) => {
      wake = resolve;
    });
  async function* batches(): AsyncGenerator<RecordBatch<Item>> {
    for (;;) {
      if (queue.length === 0) await nextSent();
      const next = queue.shift();
      if (next === "end" || next === undefined) return;
      if (next instanceof Error) throw next;
      yield next;
    }
  }
  const source: RecordSource<Item> = {
    key: ({ id }) => id,
    load: (context) => {
      loads.push(context);
      return batches();
    },
    ...(commitWith && {
      commit: async (changes) => {
        commits.push(changes);
        if (held) await held;
        return commitWith(changes);
      },
    }),
  };
  /** Makes saves wait until the function it returns is called */
  const holdSaves = () => {
    let release = () => {};
    held = new Promise((resolve) => {
      release = resolve;
    });
    return release;
  };
  return {
    source,
    loads,
    commits,
    holdSaves,
    push: (records: Item[], totalBatches?: number) =>
      send({ records, totalBatches }),
    end: () => send("end"),
    fail: (message: string) => send(new Error(message)),
  };
};

/** Reads data while the flow is being set up, before plugins after it tap the data pipeline */
class ReadsDataEarlyPlugin implements PlayerPlugin {
  name = "reads-data-early";

  apply(player: Player) {
    player.hooks.dataController.tap(this.name, (dataController) => {
      dataController.get("group");
    });
  }
}

interface SetupOptions {
  content?: Flow;
  commitWith?: ((changes: RecordChanges<Item>) => CommitResult<Item>) | null;
  pluginsBefore?: PlayerPlugin[];
}

const setup = ({
  content = flow,
  commitWith = saveAll,
  pluginsBefore = [],
}: SetupOptions = {}) => {
  const source = feed(commitWith);
  const plugin = new StreamingDataPlugin(
    { items: source.source },
    {
      isOverlay: (state) =>
        (state as { attributes?: { overlay?: boolean } }).attributes
          ?.overlay === true,
    },
  );
  const player = new Player({
    plugins: [
      ...pluginsBefore,
      plugin,
      new ExternalStatePlugin([plugin.commitRecordsHandler]),
    ],
  });
  const log = { warn: vitest.fn(), error: vitest.fn() };
  const ignore = () => undefined;
  const handler: Logger = {
    trace: ignore,
    debug: ignore,
    info: ignore,
    ...log,
  };
  player.logger.addHandler(handler);
  const announced: string[] = [];
  player.hooks.dataController.tap("test", (dataController) => {
    dataController.hooks.onUpdate.tap("test", (updates) =>
      updates.forEach(({ binding }) => announced.push(binding.asString())),
    );
  });
  const done = player.start(content).catch(() => undefined);

  const controllers = () => {
    const state = player.getState();
    if (state.status !== "in-progress")
      throw new Error(`The flow is ${state.status}`);
    return state.controllers;
  };
  const get = (binding: string) => controllers().data.get(binding);
  const status = () => get("itemsStatus");
  const evaluate = (expression: string) =>
    controllers().expression.evaluate(expression);
  const stateName = () => controllers().flow.current?.currentState?.name;
  const saving = () =>
    controllers().view.currentView?.lastUpdate?.saving?.asset?.value;
  const viewId = () => controllers().view.currentView?.lastUpdate?.id;
  return {
    ...source,
    plugin,
    player,
    done,
    log,
    announced,
    get,
    status,
    evaluate,
    stateName,
    saving,
    viewId,
    controllers,
  };
};

type Setup = ReturnType<typeof setup>;

const loadAll = async (test: Setup, items: Item[]) => {
  test.evaluate("loadStreamingData('items')");
  test.push(items);
  test.end();
  await vitest.waitFor(() => expect(test.status()?.completed).toBe(true));
};

const names = (test: Setup) => test.get("items").map(({ name }: Item) => name);

describe("StreamingDataPlugin", () => {
  it("loads only when content asks, with its params resolved, and serves the records by reference", async () => {
    const test = setup();
    await vitest.waitFor(() =>
      expect(test.status()).toMatchObject({ started: false, loading: false }),
    );
    expect(test.get("items")).toEqual([]);
    expect(test.loads).toHaveLength(0);

    test.evaluate("loadStreamingData('items')");
    test.push([item("a"), item("b")], 2);
    await vitest.waitFor(() =>
      expect(test.status()).toMatchObject({ loadedBatches: 1 }),
    );

    expect(test.loads[0]?.params).toEqual({ group: "g1" });
    expect(test.status()).toMatchObject({
      started: true,
      loading: true,
      completed: false,
      totalBatches: 2,
      loadedRecords: 2,
      progress: 0.5,
    });
    expect(test.get("items")).toBe(test.plugin.getCollection("items")?.records);
    expect(test.get("items.1.name")).toBe("B");
    expect(Object.isFrozen(test.get("items.0"))).toBe(true);

    test.push([item("c")]);
    test.end();
    await vitest.waitFor(() =>
      expect(test.status()).toMatchObject({ completed: true, loading: false }),
    );
    expect(test.status()).toMatchObject({ loadedRecords: 3, progress: 1 });
    expect(test.player.getState().status).toBe("in-progress");
  });

  it("serves the collection when a plugin registered before it already read data", async () => {
    const test = setup({ pluginsBefore: [new ReadsDataEarlyPlugin()] });
    await loadAll(test, [item("a")]);

    expect(test.get("items")).toHaveLength(1);
    expect(test.get("items.0.name")).toBe("A");
  });

  it("keeps the collection read-only and out of the serialized data", async () => {
    const test = setup();
    await loadAll(test, [item("a")]);

    test.controllers().data.set([["items.0.name", "changed"]]);

    expect(test.get("items.0.name")).toBe("A");
    expect(test.log.warn).toHaveBeenCalledWith(
      "[StreamingDataPlugin] Ignoring a write to read-only items.0.name",
    );

    test.controllers().data.delete("items.0");

    expect(test.get("items")).toHaveLength(1);
    expect(test.log.warn).toHaveBeenCalledWith(
      "[StreamingDataPlugin] Ignoring a delete of read-only items.0",
    );
    expect(test.controllers().data.serialize()).not.toHaveProperty("items");
  });

  it("logs mistakes in declared sources, and ignores what they would have declared", async () => {
    const test = setup({
      content: {
        ...flow,
        schema: {
          ...flow.schema,
          ROOT: {
            ...flow.schema?.ROOT,
            broken: { type: "ItemType", isArray: true, source: { ref: "" } },
            copies: {
              type: "ItemType",
              isArray: true,
              source: { ref: "items", status: "itemsStatus" },
            },
            nested: {
              type: "ItemType",
              isArray: true,
              source: { ref: "items", status: "nested.status" },
            },
            unknown: {
              type: "ItemType",
              isArray: true,
              source: { ref: "nowhere" },
            },
          },
        },
      },
    });
    await vitest.waitFor(() =>
      expect(test.status()).toMatchObject({ started: false }),
    );

    expect(test.log.error.mock.calls.map(([message]) => message)).toEqual([
      "[StreamingDataPlugin] Ignoring the source declared at 'broken': `ref` must name a source",
      "[StreamingDataPlugin] Ignoring 'copies': it or its status overlaps 'itemsStatus'",
      "[StreamingDataPlugin] Ignoring 'nested': it or its status overlaps 'nested.status'",
    ]);

    test.evaluate("loadStreamingData('copies')");
    expect(test.log.warn).toHaveBeenCalledWith(
      "[StreamingDataPlugin] No collection is declared at 'copies'",
    );

    test.evaluate("loadStreamingData('unknown')");
    await vitest.waitFor(() =>
      expect(test.get("unknownStatus")).toMatchObject({
        loading: false,
        error: "No source is registered as 'nowhere'",
      }),
    );
  });

  it("announces appends at the length and replaced records at their indexes, so readers of other records stay put", async () => {
    const test = setup();
    test.evaluate("loadStreamingData('items')");
    test.push([item("a"), item("b"), item("c")]);
    await vitest.waitFor(() => expect(test.status()?.loadedRecords).toBe(3));
    expect(test.announced).toContain("items.length");
    expect(test.announced).not.toContain("items");

    test.announced.length = 0;
    test.plugin.merge("items", [item("b", "B2")]);
    expect(test.announced).toContain("items.1");
    expect(test.announced).not.toContain("items");
    expect(test.announced).not.toContain("items.length");

    test.announced.length = 0;
    test.plugin.merge("items", [], ["a"]);
    expect(test.announced).toContain("items");
  });

  it("ignores a second load with the same params, and starts over when the params change", async () => {
    const test = setup();
    await loadAll(test, [item("a")]);

    test.evaluate("loadStreamingData('items')");
    await Promise.resolve();
    expect(test.loads).toHaveLength(1);

    test.controllers().data.set([["group", "g2"]]);
    test.evaluate("loadStreamingData('items')");
    await vitest.waitFor(() => expect(test.loads).toHaveLength(2));

    expect(test.loads[0]?.signal.aborted).toBe(true);
    expect(test.loads[1]?.params).toEqual({ group: "g2" });
    expect(test.get("items")).toEqual([]);
    expect(test.status()).toMatchObject({ loading: true, loadedRecords: 0 });
  });

  it("starts over when Try again follows a failed load", async () => {
    const test = setup();
    test.evaluate("loadStreamingData('items')");
    test.push([item("a")], 3);
    test.fail("Offline");
    await vitest.waitFor(() => expect(test.status()?.error).toBe("Offline"));
    expect(test.status()).toMatchObject({ loading: false, loadedRecords: 1 });

    test.evaluate("retryStreamingData('items')");
    await vitest.waitFor(() => expect(test.loads).toHaveLength(2));
    expect(test.status()).toMatchObject({
      started: true,
      loading: true,
      loadedBatches: 0,
      loadedRecords: 0,
    });
    expect(test.status()?.error).toBeUndefined();
    expect(test.status()?.totalBatches).toBeUndefined();
    expect(test.get("items")).toEqual([]);

    test.push([item("a")]);
    test.end();
    await vitest.waitFor(() => expect(test.status()?.completed).toBe(true));
    expect(test.get("items")).toHaveLength(1);
  });

  it("cancels the load and drops the records when the flow ends", async () => {
    const test = setup();
    test.evaluate("loadStreamingData('items')");
    test.push([item("a")], 2);
    await vitest.waitFor(() => expect(test.status()?.loadedRecords).toBe(1));

    test.controllers().flow.transition("Done");
    await test.done;

    await vitest.waitFor(() =>
      expect(test.loads[0]?.signal.aborted).toBe(true),
    );
    expect(test.plugin.getCollection("items")).toBeUndefined();
  });

  it("saves the changes eachRow makes to each selected record, merges what the source returns, and transitions by outcome", async () => {
    const test = setup();
    await loadAll(test, [item("a"), item("b"), item("c")]);
    test.controllers().data.set([["selected", ["a", "c"]]]);

    test.controllers().flow.transition("Rename");
    await vitest.waitFor(() =>
      expect(test.status()?.lastCommit?.outcome).toBe("saved"),
    );
    await vitest.waitFor(() => expect(test.stateName()).toBe("VIEW_main"));

    expect(test.commits).toHaveLength(1);
    expect(test.commits[0]?.update).toEqual([
      {
        key: "a",
        patch: { name: "renamed" },
        record: { id: "a", name: "renamed" },
      },
      {
        key: "c",
        patch: { name: "renamed" },
        record: { id: "c", name: "renamed" },
      },
    ]);
    expect(names(test)).toEqual(["renamed", "B", "renamed"]);
    expect(test.status()).toMatchObject({
      committing: false,
      lastCommit: { outcome: "saved", saved: 2, failed: 0, failedKeys: [] },
    });
    expect(test.get("row")).toBeUndefined();
  });

  it("removes the records the source removed", async () => {
    const test = setup();
    await loadAll(test, [item("a"), item("b"), item("c")]);
    test.controllers().data.set([["selected", ["b", "missing"]]]);

    test.controllers().flow.transition("Remove");
    await vitest.waitFor(() =>
      expect(test.status()?.lastCommit?.outcome).toBe("saved"),
    );

    expect(test.commits[0]).toEqual({ create: [], update: [], remove: ["b"] });
    expect(names(test)).toEqual(["A", "C"]);
    expect(test.plugin.getCollection("items")?.indexOf("c")).toBe(1);
    expect(test.status()).toMatchObject({
      loadedRecords: 2,
      lastCommit: { saved: 1 },
    });
  });

  it("saves nothing, and calls it saved, when nothing changed", async () => {
    const test = setup();
    await loadAll(test, [item("a")]);
    test.controllers().data.set([["selected", []]]);

    test.controllers().flow.transition("Rename");
    await vitest.waitFor(() =>
      expect(test.status()?.lastCommit?.outcome).toBe("saved"),
    );

    expect(test.commits).toHaveLength(0);
    expect(test.status()?.lastCommit).toEqual({
      outcome: "saved",
      saved: 0,
      failed: 0,
      failedKeys: [],
    });
  });

  it("reports a partial save, keeping the records that failed as they were", async () => {
    const test = setup({
      commitWith: (changes) => ({
        records: changes.update
          .filter(({ key }) => key === "a")
          .map(({ record }) => record),
        removed: [],
        failed: [{ key: "c", reason: "Locked" }],
      }),
    });
    await loadAll(test, [item("a"), item("b"), item("c")]);
    test.controllers().data.set([["selected", ["a", "c"]]]);

    test.controllers().flow.transition("Rename");
    await vitest.waitFor(() =>
      expect(test.status()?.lastCommit?.outcome).toBe("partial"),
    );

    expect(names(test)).toEqual(["renamed", "B", "C"]);
    expect(test.status()?.lastCommit).toEqual({
      outcome: "partial",
      saved: 1,
      failed: 1,
      failedKeys: ["c"],
    });
  });

  it("fails a save the source rejects, without changing any record", async () => {
    const test = setup({
      commitWith: () => {
        throw new Error("Offline");
      },
    });
    await loadAll(test, [item("a"), item("b")]);
    test.controllers().data.set([["selected", ["a", "b"]]]);

    test.controllers().flow.transition("Rename");
    await vitest.waitFor(() =>
      expect(test.status()?.lastCommit?.outcome).toBe("failed"),
    );
    await vitest.waitFor(() => expect(test.stateName()).toBe("VIEW_main"));

    expect(names(test)).toEqual(["A", "B"]);
    expect(test.status()).toMatchObject({
      committing: false,
      lastCommit: {
        outcome: "failed",
        saved: 0,
        failed: 2,
        failedKeys: ["a", "b"],
        error: "Offline",
      },
    });
    expect(test.log.error).toHaveBeenCalledWith(
      "[StreamingDataPlugin] Saving 'items' failed: Offline",
    );
  });

  it("fails a save when the collection's source can't save", async () => {
    const test = setup({ commitWith: null });
    await loadAll(test, [item("a")]);
    test.controllers().data.set([["selected", ["a"]]]);

    test.controllers().flow.transition("Rename");
    await vitest.waitFor(() =>
      expect(test.status()?.lastCommit?.outcome).toBe("failed"),
    );

    expect(test.status()?.lastCommit).toMatchObject({
      failedKeys: ["a"],
      error: "This collection's source can't save.",
    });
    expect(names(test)).toEqual(["A"]);
  });

  it("keeps the view that started a save current, so it can show the save running", async () => {
    const test = setup();
    await loadAll(test, [item("a")]);
    test.controllers().data.set([["selected", ["a"]]]);
    const release = test.holdSaves();

    test.controllers().flow.transition("Rename");
    await vitest.waitFor(() => expect(test.saving()).toBe("Saving: true"));
    expect(test.stateName()).toBe("EXTERNAL_rename");

    release();
    await vitest.waitFor(() => expect(test.stateName()).toBe("VIEW_main"));
    await vitest.waitFor(() => expect(test.saving()).toBe("Saving: false"));
  });

  it("shows the view underneath while a save started from an overlay runs", async () => {
    const test = setup();
    await loadAll(test, [item("a")]);
    test.controllers().data.set([["selected", ["a"]]]);
    test.controllers().flow.transition("Form");
    await vitest.waitFor(() => expect(test.viewId()).toBe("form"));
    const release = test.holdSaves();

    test.controllers().flow.transition("Rename");
    await vitest.waitFor(() => expect(test.saving()).toBe("Saving: true"));
    expect(test.viewId()).toBe("main");
    expect(test.stateName()).toBe("EXTERNAL_rename");

    release();
    await vitest.waitFor(() => expect(test.stateName()).toBe("VIEW_main"));
    expect(test.get("items.0.name")).toBe("renamed");
  });

  it("fails a save whose eachRow sits inside param, where Player resolves its templates", async () => {
    const test = setup();
    await loadAll(test, [item("a")]);
    test.controllers().data.set([["selected", ["a"]]]);

    test.controllers().flow.transition("Misplaced");
    await vitest.waitFor(() => expect(test.stateName()).toBe("VIEW_main"));

    expect(test.commits).toHaveLength(0);
    expect(test.log.error).toHaveBeenCalledWith(
      "[StreamingDataPlugin] Can't save: `eachRow` goes on the state beside `param`, where Player leaves it as written",
    );
  });
});
