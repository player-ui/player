import { test, expect, vitest } from "vitest";
import { Player } from "@player-ui/player";
import type { DataController } from "@player-ui/player";
import { ContextPlugin } from "../plugin";
import { ContextPluginSymbol } from "../symbols";
import {
  StateContextPlugin,
  dataContextKey,
  flowIdContextKey,
  flowStateContextKey,
  playerStateContextKey,
  playerStatusContextKey,
  viewContextKey,
  viewIdContextKey,
} from "../state-plugin";

const minimalFlow = {
  id: "flow-state-test",
  views: [{ id: "view-1", type: "info" }],
  data: { name: "Ada" },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        ref: "view-1",
        state_type: "VIEW",
        transitions: { "*": "END_Done" },
      },
      END_Done: { state_type: "END", outcome: "done" },
    },
  },
};

test("StateContextPlugin auto-registers a ContextPlugin if absent", () => {
  const state = new StateContextPlugin();
  const player = new Player({ plugins: [state] });
  const ctx = player.findPlugin<ContextPlugin>(ContextPluginSymbol);
  expect(ctx).toBeInstanceOf(ContextPlugin);
});

test("StateContextPlugin reuses an existing ContextPlugin", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  const player = new Player({ plugins: [ctx, state] });
  expect(player.findPlugin<ContextPlugin>(ContextPluginSymbol)).toBe(ctx);
});

test("publishes flow id, view id, view, data, status on flow start", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  const player = new Player({ plugins: [ctx, state] });

  player.start(minimalFlow as any);

  expect(ctx.get(flowIdContextKey)).toBe("flow-state-test");
  expect(ctx.get(playerStatusContextKey)).toBe("in-progress");
  expect(ctx.get(flowStateContextKey)).toBe("VIEW_1");
  expect(ctx.get(viewIdContextKey)).toBe("view-1");
  expect(ctx.get(viewContextKey)).toMatchObject({
    id: "view-1",
    type: "info",
  });
  expect(ctx.get(dataContextKey)).toEqual({ name: "Ada" });
});

test("data context entry updates when the data controller updates", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  const player = new Player({ plugins: [ctx, state] });

  let dataController: DataController | undefined;
  player.hooks.dataController.tap("test", (dc) => {
    dataController = dc;
  });

  player.start(minimalFlow as any);
  dataController!.set([["name", "Grace"]]);

  expect(ctx.get(dataContextKey)).toEqual({ name: "Grace" });
});

test("list() reports all six state-context descriptors after StateContextPlugin applies", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  new Player({ plugins: [ctx, state] });

  const descriptions = ctx.list().map((d) => d.description);
  expect(descriptions).toEqual(
    expect.arrayContaining([
      flowIdContextKey.description,
      flowStateContextKey.description,
      viewIdContextKey.description,
      viewContextKey.description,
      dataContextKey.description,
      playerStatusContextKey.description,
    ]),
  );
});

test("aggregate playerStateContextKey composes every published source", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  const player = new Player({ plugins: [ctx, state] });

  player.start(minimalFlow as any);

  const snapshot = ctx.get(playerStateContextKey);
  expect(snapshot).toEqual({
    status: "in-progress",
    flow: { id: "flow-state-test", state: "VIEW_1" },
    view: {
      id: "view-1",
      resolved: expect.objectContaining({ id: "view-1", type: "info" }),
    },
    data: { name: "Ada" },
  });
});

test("aggregate subscribers fire when any source updates", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  const player = new Player({ plugins: [ctx, state] });

  let dataController: DataController | undefined;
  player.hooks.dataController.tap("test", (dc) => {
    dataController = dc;
  });

  const handler = vitest.fn();
  ctx.subscribe(playerStateContextKey, handler);

  player.start(minimalFlow as any);
  handler.mockClear();
  dataController!.set([["name", "Grace"]]);

  expect(handler).toHaveBeenCalled();
  const lastCall = handler.mock.calls[handler.mock.calls.length - 1];
  expect(lastCall[0]).toMatchObject({ data: { name: "Grace" } });
});

test("status flips to completed after the flow ends", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  const player = new Player({ plugins: [ctx, state] });

  player.start(minimalFlow as any);
  player.hooks.state.call({
    status: "completed",
    flow: minimalFlow as any,
  } as any);

  expect(ctx.get(playerStatusContextKey)).toBe("completed");
});
