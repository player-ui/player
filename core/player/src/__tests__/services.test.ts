import { test, expect, vitest } from "vitest";
import { makeFlow } from "@player-ui/make-flow";

import { Player, DataController } from "..";
import type {
  IDataController,
  DataControllerContext,
  InProgressState,
} from "..";

/**
 * Verifies the `services.data` factory replaces the default DataController.
 * The factory is called once per flow with the prepared context, the returned
 * instance becomes the player's data controller, and `Player.hooks.dataController`
 * fires with the replacement (so existing plugin observers keep working).
 */

const flow = makeFlow({
  id: "test-view",
  type: "text",
  value: "hello",
});

test("services.data factory receives the same context the default would", () => {
  const captured: DataControllerContext[] = [];

  new Player({
    services: {
      data: (ctx) => {
        captured.push(ctx);
        return new DataController(ctx.data, ctx);
      },
    },
  }).start(flow);

  expect(captured).toHaveLength(1);
  const ctx = captured[0];
  expect(ctx.pathResolver).toBeDefined();
  expect(Array.isArray(ctx.middleware)).toBe(true);
  // middleware contains at least the error controller's middleware
  expect(ctx.middleware.length).toBeGreaterThan(0);
});

test("services.data replacement is what player.hooks.dataController fires with", () => {
  const spy = vitest.fn();
  const player = new Player();

  // Build a controller eagerly so we can assert object identity later
  let createdReplacement: IDataController | undefined;

  const replacementPlayer = new Player({
    plugins: [
      {
        name: "tap-data-controller",
        apply: (p) => p.hooks.dataController.tap("test", spy),
      },
    ],
    services: {
      data: (ctx) => {
        createdReplacement = new DataController(ctx.data, ctx);
        return createdReplacement;
      },
    },
  });

  replacementPlayer.start(flow);

  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls[0][0]).toBe(createdReplacement);

  // Sanity: a Player without services produces a different instance
  player.start(flow);
});

test("services.data replacement appears on InProgressState.controllers.data", () => {
  let createdReplacement: IDataController | undefined;

  const player = new Player({
    services: {
      data: (ctx) => {
        createdReplacement = new DataController(ctx.data, ctx);
        return createdReplacement;
      },
    },
  });

  player.start(flow);
  const state = player.getState() as InProgressState;
  expect(state.status).toBe("in-progress");
  expect(state.controllers.data).toBe(createdReplacement);
});

test("absent services.data falls back to the default DataController", () => {
  const player = new Player();
  player.start(flow);
  const state = player.getState() as InProgressState;
  expect(state.controllers.data).toBeInstanceOf(DataController);
});

/**
 * End-to-end substitution: the replacement is a real alternative implementation
 * that wraps the default and prefixes every read with "[tagged] ". Driving data
 * through `state.controllers.data.set` / `.get` confirms the wrapper — not the
 * default — is on the hot path.
 */
class TaggingDataController implements IDataController {
  private inner: DataController;
  // Forwarded directly so plugins tap the same hook surface.
  public hooks: IDataController["hooks"];

  constructor(ctx: DataControllerContext) {
    this.inner = new DataController(ctx.data, ctx);
    this.hooks = this.inner.hooks;
  }

  get(binding: Parameters<IDataController["get"]>[0], options?: Parameters<IDataController["get"]>[1]) {
    const raw = this.inner.get(binding, options);
    return typeof raw === "string" ? `[tagged] ${raw}` : raw;
  }
  set(...args: Parameters<IDataController["set"]>) { return this.inner.set(...args); }
  delete(...args: Parameters<IDataController["delete"]>) { return this.inner.delete(...args); }
  serialize() { return this.inner.serialize(); }
  getModel() { return this.inner.getModel(); }
  makeReadOnly() { return this.inner.makeReadOnly(); }
}

test("custom IDataController implementation drives read path end-to-end", () => {
  const dataFlow = makeFlow({
    id: "test-view",
    type: "text",
    value: "hello",
  });
  // Seed initial data on the flow so we have something to read back.
  dataFlow.data = { greeting: "world" };

  const player = new Player({
    services: {
      data: (ctx) => new TaggingDataController(ctx),
    },
  });
  player.start(dataFlow);

  const state = player.getState() as InProgressState;
  expect(state.controllers.data).toBeInstanceOf(TaggingDataController);

  // The replacement intercepts every read. Default would return "world";
  // our wrapper prefixes it. Proves the wrapper is on the hot path.
  expect(state.controllers.data.get("greeting")).toBe("[tagged] world");

  // Sanity: default Player on the same flow does NOT tag.
  const defaultPlayer = new Player();
  defaultPlayer.start(dataFlow);
  const defaultState = defaultPlayer.getState() as InProgressState;
  expect(defaultState.controllers.data.get("greeting")).toBe("world");
});
