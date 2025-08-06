import { expect, test, describe, vi, beforeEach } from "vitest";
import {
  Node,
  InProgressState,
  ErrorState,
  PlayerPlugin,
  AssetTransformCorePlugin,
  BeforeTransformFunction,
  Flow,
} from "@player-ui/player";
import { Player, Parser } from "@player-ui/player";
import { waitFor } from "@testing-library/react";
import {
  AsyncNodePlugin,
  AsyncNodePluginPlugin,
  createAsyncTransform,
} from "../index";
import { CheckPathPlugin } from "@player-ui/check-path-plugin";
import { Registry } from "@player-ui/partial-match-registry";

const transform: BeforeTransformFunction = createAsyncTransform({
  transformAssetType: "chat-message",
  wrapperAssetType: "collection",
  getNestedAsset: (node) => node.children?.[0]?.value,
});

const transformPlugin = new AssetTransformCorePlugin(
  new Registry([[{ type: "chat-message" }, { beforeResolve: transform }]]),
);

class TestAsyncPlugin implements PlayerPlugin {
  name = "test-async";
  apply(player: Player) {
    player.hooks.view.tap("test-async", (view) => {
      transformPlugin.apply(view);
    });
  }
}

describe("view", () => {
  const basicFRFWithActions = {
    id: "test-flow",
    views: [
      {
        id: "my-view",
        actions: [
          {
            asset: {
              id: "action-0",
              type: "action",
              value: "{{foo.bar}}",
            },
          },
          {
            id: "nodeId",
            async: "true",
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
  };

  const chatMessageContent = {
    id: "chat",
    views: [
      {
        id: "1",
        type: "chat-message",
        value: {
          asset: {
            id: "2",
            type: "text",
            value: "chat message",
          },
        },
      },
    ],
    data: {
      foo: true,
    },
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: "1",
          transitions: {
            "*": "END_Done",
          },
        },
        END_Done: {
          state_type: "END",
          outcome: "DONE",
        },
      },
    },
  };

  const simpleAsyncContent: Flow = {
    id: "test-flow",
    views: [
      {
        type: "view",
        id: "my-view",
        values: {
          async: true,
          id: "async-values",
        },
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
  };

  const asyncNodeTest = async (resolvedValue: any) => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let deferredResolve: ((value: any) => void) | undefined;

    let updateContent: any;

    plugin.hooks.onAsyncNode.tap(
      "test",
      async (node: Node.Async, update: (content: any) => void) => {
        const result = new Promise((resolve) => {
          deferredResolve = resolve; // Promise would be resolved only once
        });

        updateContent = update;
        // Return the result to follow the same mechanism as before
        return result;
      },
    );

    let updateNumber = 0;

    const player = new Player({ plugins: [plugin] });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", () => {
          updateNumber++;
        });
      });
    });

    player.start(basicFRFWithActions as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1]).toBeUndefined();

    await waitFor(() => {
      expect(deferredResolve).toBeDefined();
    });

    // Consumer responds with null/undefined
    if (deferredResolve) {
      deferredResolve(resolvedValue);
    }

    await waitFor(() => {
      expect(updateNumber).toBe(1);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions.length).toBe(1);

    // Consumer responds with null/undefined
    if (deferredResolve) {
      updateContent(resolvedValue);
    }

    //Even after an update, the view should not change as we are deleting the resolved node if there is no view update
    await waitFor(() => {
      expect(updateNumber).toBe(1);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions.length).toBe(1);
  };

  test("should resolve async content children", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    const asyncNodeHandler = vi.fn();
    asyncNodeHandler.mockResolvedValue([
      {
        asset: {
          id: "test-1",
          type: "text",
          value: "Test 1",
        },
      },
      {
        asset: {
          id: "test-2",
          type: "text",
          value: "Test 2",
        },
      },
    ]);

    plugin.hooks.onAsyncNode.tap("test", asyncNodeHandler);
    const player = new Player({ plugins: [plugin] });

    player.start(simpleAsyncContent);

    await waitFor(() => {
      expect(asyncNodeHandler).toHaveBeenCalled();
      const playerState = player.getState();
      expect(playerState.status).toBe("in-progress");
      expect(
        (playerState as InProgressState).controllers.view.currentView
          ?.lastUpdate,
      ).toStrictEqual(
        expect.objectContaining({
          values: [
            {
              asset: {
                id: "test-1",
                type: "text",
                value: "Test 1",
              },
            },
            {
              asset: {
                id: "test-2",
                type: "text",
                value: "Test 2",
              },
            },
          ],
        }),
      );
    });
  });

  test("should return current node view when the resolved node is null", async () => {
    await asyncNodeTest(null);
  });

  test("should return current node view when the resolved node is undefined", async () => {
    await asyncNodeTest(undefined);
  });

  test("can handle multiple updates through callback mechanism", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let deferredResolve: ((value: any) => void) | undefined;

    let updateContent: any;

    plugin.hooks.onAsyncNode.tap(
      "test",
      async (node: Node.Async, update: (content: any) => void) => {
        const result = new Promise((resolve) => {
          deferredResolve = resolve; // Promise would be resolved only once
        });

        updateContent = update;
        // Return the result to follow the same mechanism as before
        return result;
      },
    );

    let updateNumber = 0;

    const player = new Player({ plugins: [plugin] });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", (update) => {
          updateNumber++;
        });
      });
    });

    player.start(basicFRFWithActions as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.actions[1]).toBeUndefined();

    await waitFor(() => {
      expect(updateNumber).toBe(1);
      expect(deferredResolve).toBeDefined();
    });

    if (deferredResolve) {
      deferredResolve({
        asset: {
          id: "next-label-action",
          type: "action",
          value: "dummy value",
        },
      });
    }

    await waitFor(() => {
      expect(updateNumber).toBe(2);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1].asset.type).toBe("action");
    expect(updateNumber).toBe(2);

    if (deferredResolve) {
      updateContent(null);
    }

    await waitFor(() => {
      expect(updateNumber).toBe(3);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1]).toBeUndefined();
  });

  test("can handle multiple updates through callback mechanism - init with handler", async () => {
    let deferredResolve: ((value: any) => void) | undefined;

    let updateContent: any;

    const asyncHandler = (
      node: Node.Async,
      callback: (content: any) => void,
    ) => {
      const result = new Promise((resolve) => {
        deferredResolve = resolve; // Promise would be resolved only once
      });

      updateContent = callback;
      // Return the result to follow the same mechanism as before
      return result;
    };

    const plugin = new AsyncNodePlugin(
      {
        plugins: [new AsyncNodePluginPlugin()],
      },
      asyncHandler,
    );

    let updateNumber = 0;

    const player = new Player({ plugins: [plugin] });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", (update) => {
          updateNumber++;
        });
      });
    });

    player.start(basicFRFWithActions as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.actions[1]).toBeUndefined();

    await waitFor(() => {
      expect(updateNumber).toBe(1);
      expect(deferredResolve).toBeDefined();
    });

    if (deferredResolve) {
      deferredResolve({
        asset: {
          id: "next-label-action",
          type: "action",
          value: "dummy value",
        },
      });
    }

    await waitFor(() => {
      expect(updateNumber).toBe(2);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1].asset.type).toBe("action");
    expect(updateNumber).toBe(2);

    if (deferredResolve) {
      updateContent(null);
    }

    await waitFor(() => {
      expect(updateNumber).toBe(3);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1]).toBeUndefined();
  });

  test("replaces async nodes with provided node", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let deferredResolve: ((value: any) => void) | undefined;

    plugin.hooks.onAsyncNode.tap("test", async (node: Node.Async) => {
      return new Promise((resolve) => {
        deferredResolve = resolve;
      });
    });
    let updateNumber = 0;

    const player = new Player({ plugins: [plugin] });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", (update) => {
          updateNumber++;
        });
      });
    });

    player.start(basicFRFWithActions as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1]).toBeUndefined();
    expect(updateNumber).toBe(1);

    await waitFor(() => {
      expect(deferredResolve).toBeDefined();
    });

    if (deferredResolve) {
      deferredResolve({
        asset: {
          id: "next-label-action",
          type: "action",
          value: "dummy value",
        },
      });
    }

    await waitFor(() => {
      expect(updateNumber).toBe(2);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1].asset.type).toBe("action");
  });

  test("init with handler", async () => {
    let deferredResolve: ((value: any) => void) | undefined;

    const asyncHandler = (node: Node.Async) => {
      return new Promise((resolve) => {
        deferredResolve = resolve;
      });
    };

    const plugin = new AsyncNodePlugin(
      {
        plugins: [new AsyncNodePluginPlugin()],
      },
      asyncHandler,
    );

    let updateNumber = 0;

    const player = new Player({ plugins: [plugin] });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", (update) => {
          updateNumber++;
        });
      });
    });

    player.start(basicFRFWithActions as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1]).toBeUndefined();
    expect(updateNumber).toBe(1);

    await waitFor(() => {
      expect(deferredResolve).toBeDefined();
    });

    if (deferredResolve) {
      deferredResolve({
        asset: {
          id: "next-label-action",
          type: "action",
          value: "dummy value",
        },
      });
    }

    await waitFor(() => {
      expect(updateNumber).toBe(2);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1].asset.type).toBe("action");
  });

  test("replaces async nodes with multi node", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let deferredResolve: ((value: any) => void) | undefined;

    plugin.hooks.onAsyncNode.tap("test", async (node) => {
      return new Promise((resolve) => {
        deferredResolve = resolve;
      });
    });

    let updateNumber = 0;

    const player = new Player({ plugins: [plugin] });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", (update) => {
          updateNumber++;
        });
      });
    });

    player.start(basicFRFWithActions as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.actions[1]).toBeUndefined();
    expect(updateNumber).toBe(1);

    await waitFor(() => {
      expect(deferredResolve).toBeDefined();
    });

    if (deferredResolve) {
      deferredResolve([
        {
          asset: {
            id: "value-1",
            type: "text",
            value: "1st value in the multinode",
          },
        },
        {
          asset: {
            id: "value-2",
            type: "text",
            value: "2nd value in the multinode",
          },
        },
      ]);
    }

    await waitFor(() => {
      expect(updateNumber).toBe(2);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1][0].asset.type).toBe("text");
    expect(view?.actions[1][1].asset.type).toBe("text");
  });

  test("replaces async nodes with chained multiNodes", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let deferredResolve: ((value: any) => void) | undefined;

    plugin.hooks.onAsyncNode.tap("test", async (node: Node.Async) => {
      return new Promise((resolve) => {
        deferredResolve = resolve;
      });
    });
    let updateNumber = 0;

    const player = new Player({ plugins: [plugin] });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", (update) => {
          updateNumber++;
        });
      });
    });

    player.start(basicFRFWithActions as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.actions[1]).toBeUndefined();

    await waitFor(() => {
      expect(updateNumber).toBe(1);
      expect(deferredResolve).toBeDefined();
    });

    if (deferredResolve) {
      deferredResolve([
        {
          asset: {
            id: "value-1",
            type: "text",
            value: "1st value in the multinode",
          },
        },
        {
          id: "another-async",
          async: true,
        },
      ]);
    }

    await waitFor(() => {
      expect(updateNumber).toBe(2);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1][0].asset.type).toBe("text");
    expect(view?.actions[2]).toBeUndefined();
    expect(updateNumber).toBe(2);

    if (deferredResolve) {
      deferredResolve([
        {
          asset: {
            id: "value-2",
            type: "text",
            value: "2nd value in the multinode",
          },
        },
        {
          asset: {
            id: "value-3",
            type: "text",
            value: "3rd value in the multinode",
          },
        },
      ]);
    }

    await waitFor(() => {
      expect(updateNumber).toBe(3);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1][0].asset.type).toBe("text");
    expect(view?.actions[1][1][0].asset.type).toBe("text");
    expect(view?.actions[1][1][1].asset.type).toBe("text");
  });

  test("replaces async nodes with chained multiNodes singular", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let deferredResolve: ((value: any) => void) | undefined;

    plugin.hooks.onAsyncNode.tap("test", async (node: Node.Async) => {
      return new Promise((resolve) => {
        deferredResolve = resolve;
      });
    });
    let updateNumber = 0;

    const player = new Player({ plugins: [plugin] });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", (update) => {
          updateNumber++;
        });
      });
    });

    player.start(basicFRFWithActions as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.actions[1]).toBeUndefined();

    await waitFor(() => {
      expect(updateNumber).toBe(1);
      expect(deferredResolve).toBeDefined();
    });

    if (deferredResolve) {
      deferredResolve([
        {
          asset: {
            id: "value-1",
            type: "text",
            value: "1st value in the multinode",
          },
        },
        {
          id: "another-async",
          async: true,
        },
      ]);
    }

    await waitFor(() => {
      expect(updateNumber).toBe(2);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1][0].asset.type).toBe("text");
    expect(view?.actions[2]).toBeUndefined();

    if (deferredResolve) {
      deferredResolve({
        asset: {
          id: "value-2",
          type: "text",
          value: "2nd value in the multinode",
        },
      });
    }

    await waitFor(() => {
      expect(updateNumber).toBe(3);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.actions[0].asset.type).toBe("action");
    expect(view?.actions[1][0].asset.type).toBe("text");
    expect(view?.actions[1][1].asset.type).toBe("text");
  });

  test("should call onAsyncNode hook when async node is encountered", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let localNode: Node.Async;
    plugin.hooks.onAsyncNode.tap("test", async (node: Node.Async) => {
      if (node !== null) {
        // assigns node value to a local variable
        localNode = node;
      }

      return new Promise((resolve) => {
        resolve("Promise resolved");
      });
    });

    const player = new Player({ plugins: [plugin] });

    player.start(basicFRFWithActions as any);

    await waitFor(() => {
      expect(localNode.id).toStrictEqual("nodeId");
      expect(localNode.type).toStrictEqual("async");
    });
  });

  describe("Async Node Error Handling", () => {
    let failingAsyncNodePlugin: AsyncNodePlugin = new AsyncNodePlugin({});
    const onAsyncNodeErrorCallback = vi.fn();

    beforeEach(() => {
      onAsyncNodeErrorCallback.mockReset();
      const failingHandler = vi.fn();
      failingHandler.mockRejectedValue("Promise Rejected");

      failingAsyncNodePlugin = new AsyncNodePlugin(
        {
          plugins: [new AsyncNodePluginPlugin()],
        },
        failingHandler,
      );

      failingAsyncNodePlugin.hooks.onAsyncNodeError.tap(
        "test",
        onAsyncNodeErrorCallback,
      );
    });

    test("should replace the async node with the result from the onAsyncNodeError hook when there is an error handling the async node", async () => {
      onAsyncNodeErrorCallback.mockReturnValue({
        asset: {
          id: "async-text",
          type: "text",
          value: "Fallback Text",
        },
      });

      const player = new Player({ plugins: [failingAsyncNodePlugin] });
      player.start(basicFRFWithActions as any);

      await waitFor(() => {
        expect(onAsyncNodeErrorCallback).toHaveBeenCalledWith(
          new Error("Promise Rejected"),
          expect.anything(),
        );

        const playerState = player.getState();
        expect(playerState.status).toBe("in-progress");
        const inProgressState = playerState as InProgressState;
        const lastViewUpdate =
          inProgressState.controllers.view.currentView?.lastUpdate;

        expect(lastViewUpdate?.actions[1]).toStrictEqual({
          asset: {
            id: "async-text",
            type: "text",
            value: "Fallback Text",
          },
        });
      });
    });

    test("should bubble up the error and cause player to fail when there is an error handling the async node and the onAsyncNodeError hook does not produce a fallback", async () => {
      onAsyncNodeErrorCallback.mockReturnValue(undefined);

      const player = new Player({ plugins: [failingAsyncNodePlugin] });
      player.start(basicFRFWithActions as any).catch(() => {
        /** Purposefully failing player in this test so catching the unresolved exception suppresses warnings from vitest */
      });

      await waitFor(() => {
        expect(onAsyncNodeErrorCallback).toHaveBeenCalledWith(
          new Error("Promise Rejected"),
          expect.anything(),
        );

        const playerState = player.getState();
        expect(playerState.status).toBe("error");
        const errorState = playerState as ErrorState;
        expect(errorState.error.message).toBe("Promise Rejected");
      });
    });
  });

  test("chat-message asset - replaces async nodes with multi node flattened", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let deferredResolve: ((value: any) => void) | undefined;

    plugin.hooks.onAsyncNode.tap("test", async () => {
      return new Promise((resolve) => {
        deferredResolve = resolve;
      });
    });

    let updateNumber = 0;

    const plugins = [plugin, new TestAsyncPlugin()];

    const player = new Player({
      plugins: plugins,
    });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", () => {
          updateNumber++;
        });
      });
    });

    player.start(chatMessageContent as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.values[0].asset.type).toBe("text");
    expect(updateNumber).toBe(1);

    await waitFor(() => {
      expect(deferredResolve).toBeDefined();
    });

    if (deferredResolve) {
      deferredResolve([
        {
          asset: {
            id: "2",
            type: "text",
            value: "Hello World!",
          },
        },
        {
          asset: {
            id: "3",
            type: "text",
            value: "Hello World!",
          },
        },
      ]);
    }

    await waitFor(() => {
      expect(updateNumber).toBe(2);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.values[1].asset.type).toBe("text");
    expect(view?.values[2].asset.type).toBe("text");
  });

  test("chat-message asset - replaces async nodes with provided node", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let deferredResolve: ((value: any) => void) | undefined;

    plugin.hooks.onAsyncNode.tap("test", async (node) => {
      return new Promise((resolve) => {
        deferredResolve = resolve;
      });
    });

    let updateNumber = 0;

    const plugins = [plugin, new TestAsyncPlugin()];

    const player = new Player({
      plugins: plugins,
    });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", (update) => {
          updateNumber++;
        });
      });
    });

    player.start(chatMessageContent as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.values[0].asset.type).toBe("text");
    expect(view?.values[0].asset.value).toBe("chat message");
    expect(updateNumber).toBe(1);

    await waitFor(() => {
      expect(deferredResolve).toBeDefined();
    });

    if (deferredResolve) {
      deferredResolve({
        asset: {
          id: "2",
          type: "text",
          value: "async content",
        },
      });
    }

    await waitFor(() => {
      expect(updateNumber).toBe(2);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.values[1].asset.type).toBe("text");
    expect(view?.values[1].asset.value).toBe("async content");
  });

  test("chat-message asset - replaces async nodes with chat-message asset", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let deferredResolve: ((value: any) => void) | undefined;

    plugin.hooks.onAsyncNode.tap("test", async (node) => {
      return new Promise((resolve) => {
        deferredResolve = resolve;
      });
    });

    let updateNumber = 0;

    const player = new Player({
      plugins: [plugin, new TestAsyncPlugin()],
    });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", (update) => {
          updateNumber++;
        });
      });
    });

    player.start(chatMessageContent as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.values[0].asset.type).toBe("text");
    expect(view?.values[0].asset.value).toBe("chat message");
    expect(updateNumber).toBe(1);

    await waitFor(() => {
      expect(deferredResolve).toBeDefined();
    });

    if (deferredResolve) {
      deferredResolve({
        asset: {
          id: "3",
          type: "chat-message",
          value: {
            asset: {
              id: "4",
              type: "text",
              value: "async content",
            },
          },
        },
      });
    }

    await waitFor(() => {
      expect(updateNumber).toBe(2);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.values[1].asset.type).toBe("text");
    expect(view?.values[1].asset.value).toBe("async content");
  });

  test("chat-message asset - resolve chained chat-message", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let deferredResolve: ((value: any) => void) | undefined;

    plugin.hooks.onAsyncNode.tap("test", async (node) => {
      return new Promise((resolve) => {
        deferredResolve = resolve;
      });
    });

    let updateNumber = 0;

    const plugins = [plugin, new TestAsyncPlugin()];

    const player = new Player({
      plugins: plugins,
    });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", (update) => {
          updateNumber++;
        });
      });
    });

    player.start(chatMessageContent as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.values[0].asset.type).toBe("text");
    expect(view?.values[0].asset.value).toBe("chat message");
    expect(updateNumber).toBe(1);

    await waitFor(() => {
      expect(deferredResolve).toBeDefined();
    });

    if (deferredResolve) {
      deferredResolve({
        asset: {
          id: "3",
          type: "chat-message",
          value: {
            asset: {
              id: "4",
              type: "text",
              value: "async content",
            },
          },
        },
      });
    }

    await waitFor(() => {
      expect(updateNumber).toBe(2);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.values[1].asset.type).toBe("text");
    expect(view?.values[1].asset.value).toBe("async content");

    if (deferredResolve) {
      deferredResolve({
        asset: {
          id: "5",
          type: "chat-message",
          value: {
            asset: {
              id: "6",
              type: "text",
              value: "chained async content",
            },
          },
        },
      });
    }

    await waitFor(() => {
      expect(updateNumber).toBe(3);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.values[2].asset.type).toBe("text");
    expect(view?.values[2].asset.value).toBe("chained async content");
  });

  test("chat-message asset - resolve chained chat-message with CheckPathPlugin", async () => {
    const plugin = new AsyncNodePlugin({
      plugins: [new AsyncNodePluginPlugin()],
    });

    let deferredResolve: ((value: any) => void) | undefined;

    plugin.hooks.onAsyncNode.tap("test", async (node) => {
      return new Promise((resolve) => {
        deferredResolve = resolve;
      });
    });

    let updateNumber = 0;

    const checkPathPlugin = new CheckPathPlugin();

    const plugins = [plugin, new TestAsyncPlugin(), checkPathPlugin];

    const player = new Player({
      plugins: plugins,
    });

    player.hooks.viewController.tap("async-node-test", (vc) => {
      vc.hooks.view.tap("async-node-test", (view) => {
        view.hooks.onUpdate.tap("async-node-test", (update) => {
          updateNumber++;
        });
      });
    });

    player.start(chatMessageContent as any);

    let view = (player.getState() as InProgressState).controllers.view
      .currentView?.lastUpdate;

    expect(view).toBeDefined();
    expect(view?.values[0].asset.type).toBe("text");
    expect(view?.values[0].asset.value).toBe("chat message");
    expect(updateNumber).toBe(1);

    await waitFor(() => {
      expect(deferredResolve).toBeDefined();
    });

    if (deferredResolve) {
      deferredResolve({
        asset: {
          id: "chat-1",
          type: "chat-message",
          value: {
            asset: {
              id: "text-1",
              type: "text",
              value: "async content",
            },
          },
        },
      });
    }

    await waitFor(() => {
      expect(updateNumber).toBe(2);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.values[1].asset.type).toBe("text");
    expect(view?.values[1].asset.value).toBe("async content");

    expect(checkPathPlugin.getParent("text-1")).toStrictEqual({
      id: "collection-async-1",
      type: "collection",
      values: [
        {
          asset: {
            id: "2",
            type: "text",
            value: "chat message",
          },
        },
        {
          asset: {
            id: "text-1",
            type: "text",
            value: "async content",
          },
        },
      ],
    });

    if (deferredResolve) {
      deferredResolve({
        asset: {
          id: "chat-2",
          type: "chat-message",
          value: {
            asset: {
              id: "text-2",
              type: "text",
              value: "async content2",
            },
          },
        },
      });
    }

    await waitFor(() => {
      expect(updateNumber).toBe(3);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.values[2].asset.type).toBe("text");
    expect(view?.values[2].asset.value).toBe("async content2");
    expect(checkPathPlugin.getParent("text-2")).toStrictEqual({
      id: "collection-async-1",
      type: "collection",
      values: [
        {
          asset: {
            id: "2",
            type: "text",
            value: "chat message",
          },
        },
        {
          asset: {
            id: "text-1",
            type: "text",
            value: "async content",
          },
        },
        {
          asset: {
            id: "text-2",
            type: "text",
            value: "async content2",
          },
        },
      ],
    });

    if (deferredResolve) {
      deferredResolve({
        asset: {
          id: "chat-3",
          type: "chat-message",
          value: {
            asset: {
              id: "text-3",
              type: "text",
              value: "async content3",
            },
          },
        },
      });
    }

    await waitFor(() => {
      expect(updateNumber).toBe(4);
    });

    view = (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

    expect(view?.values[3].asset.type).toBe("text");
    expect(view?.values[3].asset.value).toBe("async content3");

    expect(checkPathPlugin.getParent("text-3")).toStrictEqual({
      id: "collection-async-1",
      type: "collection",
      values: [
        {
          asset: {
            id: "2",
            type: "text",
            value: "chat message",
          },
        },
        {
          asset: {
            id: "text-1",
            type: "text",
            value: "async content",
          },
        },
        {
          asset: {
            id: "text-2",
            type: "text",
            value: "async content2",
          },
        },
        {
          asset: {
            id: "text-3",
            type: "text",
            value: "async content3",
          },
        },
      ],
    });
  });

  describe("multi-view cache", () => {
    let asyncNodePlugin: AsyncNodePlugin = new AsyncNodePlugin({});
    const deferHandler = vi.fn();
    let deferredResolve = (value: any) => {};

    beforeEach(() => {
      deferHandler.mockReset();
      deferHandler.mockImplementation(
        () =>
          new Promise((res) => {
            deferredResolve = res;
          }),
      );

      asyncNodePlugin = new AsyncNodePlugin(
        {
          plugins: [new AsyncNodePluginPlugin()],
        },
        deferHandler,
      );
    });

    test("clear cache between views", async () => {
      const player = new Player({ plugins: [asyncNodePlugin] });
      player.start(basicFRFWithActions as any);

      await waitFor(() => {
        expect(deferHandler).toHaveBeenCalledOnce();
      });

      deferredResolve({
        asset: {
          id: "async-text",
          type: "text",
          value: "Fallback Text",
        },
      });

      await waitFor(() => {
        const playerState = player.getState();
        expect(playerState.status).toBe("in-progress");
        const inProgressState = playerState as InProgressState;
        const lastViewUpdate =
          inProgressState.controllers.view.currentView?.lastUpdate;

        expect(lastViewUpdate?.actions[1]).toStrictEqual({
          asset: {
            id: "async-text",
            type: "text",
            value: "Fallback Text",
          },
        });
      });

      deferHandler.mockClear();
      player.start(basicFRFWithActions as any);

      await waitFor(() => {
        expect(deferHandler).toHaveBeenCalledOnce();
      });

      deferredResolve({
        asset: {
          id: "async-text",
          type: "text",
          value: "New Fallback Text",
        },
      });

      await waitFor(() => {
        const playerState = player.getState();
        expect(playerState.status).toBe("in-progress");
        const inProgressState = playerState as InProgressState;
        const lastViewUpdate =
          inProgressState.controllers.view.currentView?.lastUpdate;

        expect(lastViewUpdate?.actions[1]).toStrictEqual({
          asset: {
            id: "async-text",
            type: "text",
            value: "New Fallback Text",
          },
        });
      });
    });
  });

  // For tests dealing with the startup and cleanup of promises for async nodes.
  describe("Promise Management", () => {
    test("should not start async node handling if process has already started", async () => {
      const plugin = new AsyncNodePlugin({
        plugins: [new AsyncNodePluginPlugin()],
      });

      // Create a promise that won't be resolved.
      const asyncTapFn = vi.fn();
      asyncTapFn.mockReturnValue(new Promise(() => {}));

      plugin.hooks.onAsyncNode.tap("test", asyncTapFn);

      const player = new Player({ plugins: [plugin] });
      player.start(basicFRFWithActions as any);

      await vi.waitFor(() => {
        expect(asyncTapFn).toHaveBeenCalledOnce();
      });

      // Clear the one call since it has already been checked.
      asyncTapFn.mockClear();
      const playerState = player.getState();
      expect(playerState.status).toBe("in-progress");
      // force an update while ignoring the cache.
      (playerState as InProgressState).controllers.view.currentView?.update();

      // Should not be called again.
      expect(
        vi.waitFor(() => {
          expect(asyncTapFn).toHaveBeenCalledOnce();
        }),
      ).rejects.toThrowError();
    });

    test("should allow for handling to start again if the promise completes", async () => {
      const plugin = new AsyncNodePlugin({
        plugins: [new AsyncNodePluginPlugin()],
      });

      // Create a promise that won't be resolved.
      const asyncTapFn = vi.fn();
      asyncTapFn.mockResolvedValue(null);

      plugin.hooks.onAsyncNode.tap("test", asyncTapFn);

      const player = new Player({ plugins: [plugin] });
      player.start(basicFRFWithActions as any);

      await vi.waitFor(() => {
        expect(asyncTapFn).toHaveBeenCalledOnce();
      });

      // Clear the one call since it has already been checked.
      asyncTapFn.mockClear();
      const playerState = player.getState();
      expect(playerState.status).toBe("in-progress");
      // force an update while ignoring the cache.
      (playerState as InProgressState).controllers.view.currentView?.update();

      // Should be called again.
      vi.waitFor(() => {
        expect(asyncTapFn).toHaveBeenCalledOnce();
      });
    });
  });
});

describe("parser", () => {
  test("missing node-id parent async node", async () => {
    const parser = new Parser();
    new AsyncNodePluginPlugin().applyParser(parser);
    const parsedAST = parser.parseObject({ async: "true" });

    expect(parsedAST).toStrictEqual(null);
  });

  test("missing node-id child async node", async () => {
    const parser = new Parser();
    new AsyncNodePluginPlugin().applyParser(parser);
    const parsedAST = parser.parseObject({ fields: { async: "true" } });

    expect(parsedAST).toStrictEqual(null);
  });
});
