import { expect, test, describe } from "vitest";
import {
  InProgressState,
  Flow,
  Node,
  NodeType,
  PlayerPlugin,
  AssetTransformCorePlugin,
  BeforeTransformFunction,
} from "@player-ui/player";
import { Player } from "@player-ui/player";
import { waitFor } from "@testing-library/react";
import { Registry } from "@player-ui/partial-match-registry";
import {
  AsyncNodePlugin,
  AsyncNodePluginPlugin,
  createAsyncTransform,
} from "../index";

/**
 * Repro for GenUX Agent Chat Android (Player Android/JVM 0.15.3):
 * intermittent "streaming-response-action-row" asset missing after an
 * async-node in-place update.
 *
 * Consumer callback payload (flat list, async node renewed each time):
 *   [ agent-response-wrapper, streaming-response-action-row, renewedAsyncNode ]
 * Parent container is a flatten collection.
 *
 * Core asset substitutes:
 *   agent-response-wrapper        -> "text"
 *   streaming-response-action-row -> "action"
 *
 * Staged bisection: each test adds ONE variable over the known-good
 * `simpleAsyncMultiNode` flatten fixture from index.test.ts.
 */

/** Known-good flatten fixture: a view whose `values` MultiNode holds one live async node. */
const flattenFlow = (asyncId: string): Flow => ({
  id: "test-flow",
  views: [
    {
      type: "view",
      id: "my-view",
      values: [
        {
          async: true,
          id: asyncId,
          flatten: true,
        },
      ],
    },
  ],
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "my-view",
        transitions: {},
      },
    },
  },
});

const wrapper = (i: number) => ({
  asset: { id: `wrapper-${i}`, type: "text", value: `agent response ${i}` },
});
const actionRow = (i: number) => ({
  asset: {
    id: `action-row-${i}`,
    type: "action",
    value: `actions ${i}`,
  },
});
const renewedAsync = (i: number) => ({
  id: `msg-${i}`,
  async: true,
  flatten: true,
});

/** Cycle-safe collector (resolved AST has `parent` back-refs). */
const collectAssets = (root: any): Array<{ id: string; type: string }> => {
  const out: Array<{ id: string; type: string }> = [];
  const seen = new WeakSet<object>();
  const walk = (node: any) => {
    if (node === null || typeof node !== "object" || seen.has(node)) return;
    seen.add(node);
    if (Array.isArray(node)) return node.forEach(walk);
    if (node.asset?.type) out.push({ id: node.asset.id, type: node.asset.type });
    for (const [k, v] of Object.entries(node)) {
      if (k === "parent") continue;
      if (v && typeof v === "object") walk(v);
    }
  };
  walk(root);
  return out;
};

const setup = () => {
  const plugin = new AsyncNodePlugin({ plugins: [new AsyncNodePluginPlugin()] });
  let deferredResolve: ((value: any) => void) | undefined;
  plugin.hooks.onAsyncNode.tap(
    "test",
    async () => new Promise((resolve) => (deferredResolve = resolve)),
  );
  let updateNumber = 0;
  const player = new Player({ plugins: [plugin] });
  player.hooks.viewController.tap("t", (vc) => {
    vc.hooks.view.tap("t", (view) => {
      view.hooks.onUpdate.tap("t", () => updateNumber++);
    });
  });
  return {
    player,
    getUpdateNumber: () => updateNumber,
    getResolve: () => deferredResolve,
    view: () =>
      (player.getState() as InProgressState).controllers.view.currentView
        ?.lastUpdate,
  };
};

describe("streaming action-row (GenUX Android 0.15.3 repro)", () => {
  test("stage 1: single flatten resolve, wrapper + action-row, NO renewal", async () => {
    const h = setup();
    h.player.start(flattenFlow("msg-0"));

    await waitFor(() => expect(h.getResolve()).toBeDefined());
    h.getResolve()!([wrapper(0), actionRow(0)]);

    await waitFor(() => expect(h.getUpdateNumber()).toBe(2));
    const assets = collectAssets(h.view());
    expect(assets.find((a) => a.id === "action-row-0")).toBeDefined();
    expect(assets.filter((a) => a.type === "action").length).toBe(1);
  });

  test("stage 2: single flatten resolve WITH renewed async node at tail", async () => {
    const h = setup();
    h.player.start(flattenFlow("msg-0"));

    await waitFor(() => expect(h.getResolve()).toBeDefined());
    h.getResolve()!([wrapper(0), actionRow(0), renewedAsync(1)]);

    await waitFor(() => expect(h.getUpdateNumber()).toBe(2));
    const assets = collectAssets(h.view());
    expect(assets.find((a) => a.id === "action-row-0")).toBeDefined();
    expect(assets.filter((a) => a.type === "action").length).toBe(1);
  });

  test("stage 3: chained — action-row survives every resolution", async () => {
    const MESSAGES = 6;
    const h = setup();
    h.player.start(flattenFlow("msg-0"));

    for (let i = 0; i < MESSAGES; i++) {
      await waitFor(() => expect(h.getResolve()).toBeDefined());
      const resolve = h.getResolve()!;
      const expected = h.getUpdateNumber() + 1;

      resolve([wrapper(i), actionRow(i), renewedAsync(i + 1)]);

      await waitFor(() => expect(h.getUpdateNumber()).toBe(expected));

      const assets = collectAssets(h.view());
      for (let j = 0; j <= i; j++) {
        expect(
          assets.find((a) => a.id === `action-row-${j}`),
          `after message ${i}, action-row ${j} missing. Got: ${JSON.stringify(assets)}`,
        ).toBeDefined();
      }
      expect(assets.filter((a) => a.type === "action").length).toBe(i + 1);
    }
  });
});

/* ------------------------------------------------------------------ *
 * Variant 1: transform-based container (mirrors agent-chat-container) *
 * ------------------------------------------------------------------ */

const chatTransform: BeforeTransformFunction = createAsyncTransform({
  transformAssetType: "chat-message",
  wrapperAssetType: "collection",
  getNestedAsset: (node) => node.children?.[0]?.value,
});

const chatTransformPlugin = new AssetTransformCorePlugin(
  new Registry([[{ type: "chat-message" }, { beforeResolve: chatTransform }]]),
);

class ChatTransformPlugin implements PlayerPlugin {
  name = "chat-transform";
  apply(player: Player) {
    player.hooks.view.tap("chat-transform", (view) => {
      chatTransformPlugin.apply(view);
    });
  }
}

/** A chat-message view — the transform turns it into a flatten collection with a renewing async node. */
const chatFlow: Flow = {
  id: "chat-flow",
  views: [
    {
      id: "root",
      type: "chat-message",
      value: {
        asset: { id: "seed-text", type: "text", value: "seed message" },
      },
    },
  ],
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "root",
        transitions: { "*": "END_Done" },
      },
      END_Done: { state_type: "END", outcome: "DONE" },
    },
  },
};

describe("streaming action-row — transform-based container (0.15.3)", () => {
  test("action-row survives chained chat-message resolutions", async () => {
    const MESSAGES = 5;
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });
    let deferredResolve: ((value: any) => void) | undefined;
    plugin.hooks.onAsyncNode.tap(
      "test",
      async () => new Promise((resolve) => (deferredResolve = resolve)),
    );

    let updateNumber = 0;
    const player = new Player({
      plugins: [plugin, new ChatTransformPlugin()],
    });
    player.hooks.viewController.tap("t", (vc) => {
      vc.hooks.view.tap("t", (view) => {
        view.hooks.onUpdate.tap("t", () => updateNumber++);
      });
    });

    player.start(chatFlow);

    for (let i = 0; i < MESSAGES; i++) {
      await waitFor(() => expect(deferredResolve).toBeDefined());
      const resolve = deferredResolve!;
      deferredResolve = undefined;
      const expected = updateNumber + 1;

      // Each turn: a new chat-message (renews the async) + a sibling action-row.
      resolve([
        {
          asset: {
            id: `chat-${i}`,
            type: "chat-message",
            value: {
              asset: { id: `chat-text-${i}`, type: "text", value: `msg ${i}` },
            },
          },
        },
        {
          asset: {
            id: `action-row-${i}`,
            type: "action",
            value: `actions ${i}`,
          },
        },
      ]);

      await waitFor(() => expect(updateNumber).toBe(expected));

      const view = (player.getState() as InProgressState).controllers.view
        .currentView?.lastUpdate;
      const assets = collectAssets(view);
      for (let j = 0; j <= i; j++) {
        expect(
          assets.find((a) => a.id === `action-row-${j}`),
          `after turn ${i}, action-row ${j} missing. Got: ${JSON.stringify(assets)}`,
        ).toBeDefined();
      }
      expect(assets.filter((a) => a.type === "action").length).toBe(i + 1);
    }
  });
});

/* --------------------------------------------------------------- *
 * Variant 2: two async nodes per turn (processor + content node)  *
 * --------------------------------------------------------------- */

/** Setup that captures every async resolver keyed by node id (multiple live nodes at once). */
const setupById = () => {
  const plugin = new AsyncNodePlugin({ plugins: [new AsyncNodePluginPlugin()] });
  const resolvers = new Map<string, (value: any) => void>();
  plugin.hooks.onAsyncNode.tap(
    "test",
    async (node: Node.Async) =>
      new Promise((resolve) => resolvers.set(node.id, resolve)),
  );
  let updateNumber = 0;
  const player = new Player({ plugins: [plugin] });
  player.hooks.viewController.tap("t", (vc) => {
    vc.hooks.view.tap("t", (view) => {
      view.hooks.onUpdate.tap("t", () => updateNumber++);
    });
  });
  return {
    player,
    resolvers,
    getUpdateNumber: () => updateNumber,
    view: () =>
      (player.getState() as InProgressState).controllers.view.currentView
        ?.lastUpdate,
  };
};

describe("streaming action-row — two async nodes per turn (0.15.3)", () => {
  test("action-row survives when a processor node and content node resolve in quick succession", async () => {
    const TURNS = 4;
    const h = setupById();
    h.player.start(flattenFlow("msg-0"));

    for (let i = 0; i < TURNS; i++) {
      // The live content node for this turn.
      const contentId = `msg-${i}`;
      await waitFor(() => expect(h.resolvers.has(contentId)).toBe(true));

      // Resolve content -> action-row + a processor async node + the next content node.
      // Two async children (processor + next content) land in the same multinode.
      h.resolvers.get(contentId)!([
        actionRow(i),
        { id: `proc-${i}`, async: true, flatten: true },
        { id: `msg-${i + 1}`, async: true, flatten: true },
      ]);

      // Processor resolves almost immediately (quick succession) to a wrapper.
      await waitFor(() => expect(h.resolvers.has(`proc-${i}`)).toBe(true));
      h.resolvers.get(`proc-${i}`)!(wrapper(i));

      await waitFor(() => {
        const assets = collectAssets(h.view());
        expect(assets.find((a) => a.id === `action-row-${i}`)).toBeDefined();
        expect(assets.find((a) => a.id === `wrapper-${i}`)).toBeDefined();
      });

      // All prior action-rows still present.
      const assets = collectAssets(h.view());
      for (let j = 0; j <= i; j++) {
        expect(
          assets.find((a) => a.id === `action-row-${j}`),
          `after turn ${i}, action-row ${j} missing. Got: ${JSON.stringify(assets)}`,
        ).toBeDefined();
      }
      expect(assets.filter((a) => a.type === "action").length).toBe(i + 1);
    }
  });
});
