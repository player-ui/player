import { bench, BenchOptions, describe } from "vitest";
import {
  AsyncNodePlugin,
  AsyncNodePluginPlugin,
  createAsyncTransform,
} from "..";
import {
  Asset,
  AssetTransformCorePlugin,
  BeforeTransformFunction,
  Flow,
  Player,
  PlayerPlugin,
} from "@player-ui/player";
import { Registry } from "@player-ui/partial-match-registry";

export const transform: BeforeTransformFunction<Asset<"chat-message">> =
  createAsyncTransform({
    transformAssetType: "chat-message",
    wrapperAssetType: "collection",
    getNestedAsset: (node) => node.children?.[0]?.value,
  });

const asyncTransformBenchFlow: Flow = {
  id: "test-flow",
  views: [
    {
      id: "my-view",
      type: "view",
      values: [
        {
          asset: {
            id: "chat",
            type: "chat-message",
            value: {
              asset: {
                type: "text",
                id: "original-text",
                value: "TEST",
              },
            },
          },
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
        transitions: {
          "*": "END_DONE",
        },
      },
      END_DONE: {
        state_type: "END",
        outcome: "done",
      },
    },
  },
};

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

describe("async transform benchmarks", () => {
  const asyncNodes = [1, 5, 10, 50, 100];

  asyncNodes.forEach((nodeCount) => {
    // Promise for when player reaches a completed state.
    let playerCompletePromise: Promise<unknown>;
    // Function to resolve the async node. Resolves the promise for the `onAsyncNode` hook.
    let resolveAsyncNode: () => void;

    // Setup function for spinning up player and setting up the above promise and function.
    // Using a setup function also takes all the overhead of the setup itself out of the perf benchmark.
    const setupPlayer = () => {
      const asyncNodePlugin = new AsyncNodePlugin({
        plugins: [new AsyncNodePluginPlugin()],
      });

      let completeSetup: (value?: unknown) => void = () => {};
      const setupPromise = new Promise((res) => {
        completeSetup = res;
      });

      let lastCreatedNodeIndex = -1;
      asyncNodePlugin.hooks.onAsyncNode.tap("bench", () => {
        return new Promise((resolve) => {
          const nodeNumber = lastCreatedNodeIndex + 1;
          // Setup the resolve function to add a text asset and another async node.
          resolveAsyncNode = () => {
            lastCreatedNodeIndex = nodeNumber;
            resolve([
              {
                asset: {
                  id: `chat-${nodeNumber}`,
                  type: "chat-message",
                  value: {
                    asset: {
                      type: "text",
                      id: `chat-label-${nodeNumber}`,
                      value: "Test",
                    },
                  },
                },
              },
            ]);
          };

          // If this is not the last node to be added for this test, resolve it immediately, otherwise resolve the setup promise.
          if (nodeNumber + 1 < nodeCount) {
            resolveAsyncNode();
          } else {
            completeSetup();
          }
        });
      });

      const player = new Player({
        plugins: [asyncNodePlugin, new TestAsyncPlugin()],
      });

      player.hooks.view.tap("bench", (fc) => {
        fc.hooks.onUpdate.tap("bench", () => {
          // Since the created index should go up to `nodeCount - 1` we wait for that to be true before transitioning player to its end state.
          if (lastCreatedNodeIndex < nodeCount - 1) {
            return;
          }

          const state = player.getState();

          if (state.status !== "in-progress") {
            throw new Error("benchmark failed");
          }

          state.controllers.flow.transition("END");
        });
      });

      playerCompletePromise = player.start(asyncTransformBenchFlow);

      return setupPromise;
    };

    // The bench setup function. This gets called once before all iterations of the test are run
    const setup: BenchOptions["setup"] = (task) => {
      // Add setup to the before each and wait on it to finish before starting a test run.
      task.opts.beforeEach = async () => {
        await setupPlayer();
      };
    };

    bench(
      `Resolve Async Node ${nodeCount} times`,
      async () => {
        // The test just resolves the last node and waits for player to complete.
        resolveAsyncNode();
        await playerCompletePromise;
      },
      { iterations: 100, throws: true, setup },
    );
  });
});
