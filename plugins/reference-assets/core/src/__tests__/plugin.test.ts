import { Flow, InProgressState, Logger, Player } from "@player-ui/player";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { ChatUiDemoPlugin } from "../plugins/chat-ui-demo-plugin";
import { AsyncNodePlugin } from "@player-ui/async-node-plugin";
import { ReferenceAssetsPlugin } from "../plugin";

const mockLogger = (): Logger => ({
  trace: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
});

const makeFlow = (asyncNodeCount: number): Flow => ({
  id: "flow-with-async",
  views: [
    {
      id: "collection-async-chat-demo",
      type: "view",
      values: Array.from({ length: asyncNodeCount }, (_, index) => ({
        async: true,
        id: `id-${index}`,
      })),
    },
  ],
  navigation: {
    BEGIN: "FlowStart",
    FlowStart: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "collection-async-chat-demo",
        transitions: {
          "*": "END_DONE",
        },
      },
      END_DONE: {
        state_type: "END",
        outcome: "DONE",
      },
    },
  },
});

describe("ReferenceAssetsPlugin", () => {
  let player: Player;
  let logger: Logger;
  let asyncPlugin: AsyncNodePlugin;

  beforeEach(() => {
    logger = mockLogger();

    player = new Player({
      logger,
      plugins: [new ReferenceAssetsPlugin()],
    });

    asyncPlugin = player.findPlugin<AsyncNodePlugin>(AsyncNodePlugin.Symbol)!;
  });

  describe("ChatUiPlugin", () => {
    it("should warn when there is no async node to receive the message", async () => {
      player.start(makeFlow(0));
      const state = player.getState();

      expect(state.status).toBe("in-progress");
      (state as InProgressState).controllers.expression.evaluate(
        "send('message')",
      );

      await vi.waitFor(() => {
        expect(logger.warn).toHaveBeenCalledOnce();
        expect(logger.warn).toHaveBeenCalledWith(
          "'send' called with no waiting async nodes",
        );
      });
    });

    it("should warn when there is no async node that matches the given id", async () => {
      player.start(makeFlow(1));
      const state = player.getState();

      expect(state.status).toBe("in-progress");
      (state as InProgressState).controllers.expression.evaluate(
        "send('message', 'Not a real id')",
      );

      await vi.waitFor(() => {
        expect(logger.warn).toHaveBeenCalledOnce();
        expect(logger.warn).toHaveBeenCalledWith(
          "'send' expression called with unrecognized id 'Not a real id'",
        );
      });
    });

    it("should resolve all async node to a chat message when the send expression is called without an id", async () => {
      const asyncHookTap = vi.fn();
      asyncPlugin.hooks.onAsyncNode.intercept({
        context: false,
        call: asyncHookTap,
      });
      player.start(makeFlow(2));

      await vi.waitFor(() => {
        expect(asyncHookTap).toHaveBeenCalledTimes(2);
      });

      const state = player.getState();

      expect(state.status).toBe("in-progress");
      (state as InProgressState).controllers.expression.evaluate(
        "send('message')",
      );

      await vi.waitFor(() => {
        const nextState = player.getState();
        expect(nextState.status).toBe("in-progress");
        const inProgress = nextState as InProgressState;
        const view = inProgress.controllers.view.currentView?.lastUpdate;
        expect(view).toBeDefined();
        // Don't need to test the whole view, just that the values array has been updated with the results of the 'send' command
        expect(view).toStrictEqual(
          expect.objectContaining({
            values: [
              {
                asset: {
                  type: "collection",
                  id: "collection-async-chat-demo-0",
                  values: [
                    {
                      asset: {
                        id: "chat-demo-0-value",
                        type: "text",
                        value: "message",
                      },
                    },
                  ],
                },
              },
              {
                asset: {
                  type: "collection",
                  id: "collection-async-chat-demo-1",
                  values: [
                    {
                      asset: {
                        id: "chat-demo-1-value",
                        type: "text",
                        value: "message",
                      },
                    },
                  ],
                },
              },
            ],
          }),
        );
      });
    });

    it("should resolve allow for single resolution by id", async () => {
      const asyncHookTap = vi.fn();
      asyncPlugin.hooks.onAsyncNode.intercept({
        context: false,
        call: asyncHookTap,
      });
      player.start(makeFlow(2));

      await vi.waitFor(() => {
        expect(asyncHookTap).toHaveBeenCalledTimes(2);
      });

      let state = player.getState();

      expect(state.status).toBe("in-progress");
      // resolve the second async node by targeting it by id
      (state as InProgressState).controllers.expression.evaluate(
        "send('first resolve', 'id-1')",
      );

      await vi.waitFor(() => {
        const nextState = player.getState();
        expect(nextState.status).toBe("in-progress");
        const inProgress = nextState as InProgressState;
        const view = inProgress.controllers.view.currentView?.lastUpdate;
        expect(view).toBeDefined();
        // Don't need to test the whole view, just that the values array has been updated with the results of the 'send' command
        expect(view).toStrictEqual(
          expect.objectContaining({
            values: [
              {
                asset: {
                  type: "collection",
                  id: "collection-async-chat-demo-0",
                  values: [
                    {
                      asset: {
                        id: "chat-demo-0-value",
                        type: "text",
                        value: "first resolve",
                      },
                    },
                  ],
                },
              },
            ],
          }),
        );
      });

      state = player.getState();

      expect(state.status).toBe("in-progress");
      // resolve the first async node and the new one generated by the last chat-message by allowing the plugin to resolve remaining nodes.
      (state as InProgressState).controllers.expression.evaluate(
        "send('second resolve')",
      );

      await vi.waitFor(() => {
        const nextState = player.getState();
        expect(nextState.status).toBe("in-progress");
        const inProgress = nextState as InProgressState;
        const view = inProgress.controllers.view.currentView?.lastUpdate;
        expect(view).toBeDefined();
        // Don't need to test the whole view, just that the values array has been updated with the results of the 'send' command
        expect(view).toStrictEqual(
          expect.objectContaining({
            values: [
              {
                asset: {
                  type: "collection",
                  id: "collection-async-chat-demo-1",
                  values: [
                    {
                      asset: {
                        id: "chat-demo-1-value",
                        type: "text",
                        value: "second resolve",
                      },
                    },
                  ],
                },
              },
              {
                asset: {
                  type: "collection",
                  id: "collection-async-chat-demo-0",
                  values: [
                    {
                      asset: {
                        id: "chat-demo-0-value",
                        type: "text",
                        value: "first resolve",
                      },
                    },
                    {
                      asset: {
                        id: "chat-demo-2-value",
                        type: "text",
                        value: "second resolve",
                      },
                    },
                  ],
                },
              },
            ],
          }),
        );
      });
    });
  });
});

describe("ChatUiDemoPlugin - Failed Setup", () => {
  it("should warn if the async node plugin is not found", () => {
    const logger = mockLogger();
    new Player({
      logger,
      plugins: [new ChatUiDemoPlugin()],
    });

    expect(logger.warn).toHaveBeenCalledWith(
      "Failed to apply 'chat-ui-demo-plugin'. Reason: Could not find AsyncNodePlugin.",
    );
  });
});
