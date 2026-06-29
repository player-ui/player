import { test, expect, vitest } from "vitest";
import { Player } from "@player-ui/player";
import type { DataController } from "@player-ui/player";
import { CommonTypesPlugin } from "@player-ui/common-types-plugin";
import { ReferenceAssetsPlugin } from "@player-ui/reference-assets-plugin";
import { ContextPlugin } from "../plugin";
import { ContextPluginSymbol } from "../symbols";
import {
  StateContextPlugin,
  dataContextKey,
  flowIdContextKey,
  flowStateContextKey,
  playerStateContextKey,
  playerStatusContextKey,
  setDataActionKey,
  transitionActionKey,
  validationContextKey,
  viewContextKey,
  viewIdContextKey,
} from "../state-plugin";

/**
 * A flow with a required `data.name` binding rendered by an input asset.
 * Bindings are tracked by the reference-assets renderer and the `required`
 * validator comes from the common-types plugin, so validation activates on a
 * `change` trigger when the value is cleared.
 */
const validationFlow = {
  id: "flow-validation",
  views: [
    {
      id: "view-1",
      type: "input",
      binding: "data.name",
      label: { asset: { id: "label", type: "text", value: "Name" } },
    },
  ],
  data: { name: "Ada" },
  schema: {
    ROOT: { data: { type: "DataType" } },
    DataType: {
      name: {
        type: "StringType",
        validation: [{ type: "required", trigger: "change" }],
      },
    },
  },
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

const multiViewFlow = {
  id: "flow-multi",
  views: [
    { id: "view-1", type: "info" },
    { id: "view-2", type: "info" },
  ],
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        ref: "view-1",
        state_type: "VIEW",
        transitions: { Next: "VIEW_2", "*": "END_Done" },
      },
      VIEW_2: {
        ref: "view-2",
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
  expect(snapshot).toMatchObject({
    status: "in-progress",
    flow: { id: "flow-state-test", state: "VIEW_1" },
    view: {
      id: "view-1",
      resolved: expect.objectContaining({ id: "view-1", type: "info" }),
    },
    data: { model: { name: "Ada" } },
  });
  // Actions are scoped to the construct they operate on.
  expect(typeof snapshot!.flow.transition).toBe("function");
  expect(typeof snapshot!.data.set).toBe("function");
});

test("aggregate player.state exposes invokable actions scoped to their constructs", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  const player = new Player({ plugins: [ctx, state] });

  player.start(multiViewFlow as any);
  const before = ctx.get(playerStateContextKey)!;
  expect(before.flow.state).toBe("VIEW_1");

  // The scoped flow.transition action advances the running flow.
  before.flow.transition!("Next");
  expect(ctx.get(flowStateContextKey)).toBe("VIEW_2");

  // The scoped data.set action drives the data model; reading the aggregate
  // back reflects the write through data.model.
  ctx.get(playerStateContextKey)!.data.set!("name", "Grace");
  expect(ctx.get(playerStateContextKey)!.data.model).toEqual({ name: "Grace" });

  // Transitioning again drives the flow to its terminal END state.
  ctx.get(playerStateContextKey)!.flow.transition!("Next");
  expect(ctx.get(flowStateContextKey)).toBe("END_Done");
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
  expect(lastCall[0]).toMatchObject({ data: { model: { name: "Grace" } } });
});

test("setData action is a function-valued context entry that writes to the data model", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  const player = new Player({ plugins: [ctx, state] });

  player.start(minimalFlow as any);
  const setData = ctx.get(setDataActionKey);
  expect(typeof setData).toBe("function");
  setData!("name", "Grace");

  expect(ctx.get(dataContextKey)).toEqual({ name: "Grace" });
});

test("transition action is a function-valued context entry that advances the flow", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  const player = new Player({ plugins: [ctx, state] });

  player.start(multiViewFlow as any);
  expect(ctx.get(flowStateContextKey)).toBe("VIEW_1");

  ctx.get(transitionActionKey)!("Next");

  expect(ctx.get(flowStateContextKey)).toBe("VIEW_2");
});

test("actions are absent until their controller instances exist", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  new Player({ plugins: [ctx, state] });

  // Before a flow starts there is no data/flow controller bound, so the
  // action entries hold no callable.
  expect(ctx.get(setDataActionKey)).toBeUndefined();
  expect(ctx.get(transitionActionKey)).toBeUndefined();
});

test("action entries are re-bound to the live controllers when a flow starts", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  const player = new Player({ plugins: [ctx, state] });

  player.start(minimalFlow as any);
  expect(typeof ctx.get(setDataActionKey)).toBe("function");
  expect(typeof ctx.get(transitionActionKey)).toBe("function");
});

test("validation context is empty and transitionable with no failing validations", () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  const player = new Player({
    plugins: [ctx, state, new CommonTypesPlugin(), new ReferenceAssetsPlugin()],
  });

  player.start(validationFlow as any);

  expect(ctx.get(validationContextKey)).toEqual({
    canTransition: true,
    byBinding: {},
  });
});

test("validation context reflects a failing binding and blocks transition", async () => {
  const ctx = new ContextPlugin();
  const state = new StateContextPlugin();
  const player = new Player({
    plugins: [ctx, state, new CommonTypesPlugin(), new ReferenceAssetsPlugin()],
  });

  player.start(validationFlow as any);
  const dataController = (player.getState() as any).controllers.data;
  dataController.set([["data.name", ""]]); // required → fails when empty

  await vitest.waitFor(() => {
    const validation = ctx.get(validationContextKey)!;
    expect(validation.canTransition).toBe(false);
    expect(validation.byBinding["data.name"]?.[0]).toMatchObject({
      severity: "error",
      message: expect.any(String),
      blocking: true,
    });
  });

  // The aggregate surfaces it too.
  expect(ctx.get(playerStateContextKey)!.validation.canTransition).toBe(false);

  // Fixing the value clears the validation and re-enables transition.
  dataController.set([["data.name", "Ada"]]);
  await vitest.waitFor(() => {
    expect(ctx.get(validationContextKey)).toEqual({
      canTransition: true,
      byBinding: {},
    });
  });
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
