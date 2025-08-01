import { expect, test, vitest } from "vitest";
import type { Flow, InProgressState, NamedState } from "@player-ui/player";
import { Player } from "@player-ui/player";
import { ExternalActionPlugin } from "..";
import { describe } from "node:test";
import { waitFor } from "@testing-library/react";

const externalFlow = {
  id: "test-flow",
  data: {
    transitionValue: "Next",
  },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "EXT_1",
      EXT_1: {
        state_type: "EXTERNAL",
        ref: "test-1",
        transitions: {
          Next: "END_FWD",
          Prev: "END_BCK",
        },
      },
      END_FWD: {
        state_type: "END",
        outcome: "FWD",
      },
      END_BCK: {
        state_type: "END",
        outcome: "BCK",
      },
    },
  },
};

test("handles the external state", async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin((state, options) => {
        return options.data.get("transitionValue");
      }),
    ],
  });

  const completed = await player.start(externalFlow as Flow);

  expect(completed.endState.outcome).toBe("FWD");
});

test("thrown errors will fail player", async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin((state, options) => {
        throw new Error("Bad Code");
      }),
    ],
  });

  await expect(player.start(externalFlow as Flow)).rejects.toThrow();

  expect(player.getState().status).toBe("error");
});

test("works async", async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin(() => {
        return Promise.resolve("Prev");
      }),
    ],
  });

  const completed = await player.start(externalFlow as Flow);

  expect(completed.endState.outcome).toBe("BCK");
});

test("allows multiple plugins", async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve("Next");
          }, 100);
        });
      }),
      new ExternalActionPlugin(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve("Prev");
          }, 50);
        });
      }),
      new ExternalActionPlugin(() => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(undefined);
          }, 10);
        });
      }),
    ],
  });

  const completed = await player.start(externalFlow as Flow);

  // Prev should win
  expect(completed.endState.outcome).toBe("BCK");
});

test("only transitions if player still on this external state", async () => {
  let resolver: (() => void) | undefined;
  const player = new Player({
    plugins: [
      new ExternalActionPlugin((state, options) => {
        return new Promise((res) => {
          // Only save resolver for first external action
          if (!resolver) {
            resolver = () => {
              res(options.data.get("transitionValue"));
            };
          }
        });
      }),
    ],
  });

  player.start({
    id: "test-flow",
    data: {
      transitionValue: "Next",
    },
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "EXT_1",
        EXT_1: {
          state_type: "EXTERNAL",
          ref: "test-1",
          transitions: {
            Next: "EXT_2",
            Prev: "END_BCK",
          },
        },
        EXT_2: {
          state_type: "EXTERNAL",
          ref: "test-2",
          transitions: {
            Next: "END_FWD",
            Prev: "END_BCK",
          },
        },
        END_FWD: {
          state_type: "END",
          outcome: "FWD",
        },
        END_BCK: {
          state_type: "END",
          outcome: "BCK",
        },
      },
    },
  } as Flow);

  let state = player.getState();
  expect(state.status).toBe("in-progress");
  expect(
    (state as InProgressState).controllers.flow.current?.currentState?.name,
  ).toBe("EXT_1");

  // probably dumb way to wait for async stuff to resolve
  await new Promise<void>((res) => {
    /**
     *
     */
    function waitForResolver() {
      if (resolver) res();
      else setTimeout(waitForResolver, 50);
    }

    waitForResolver();
  });

  (state as InProgressState).controllers.flow.transition("Next");

  state = player.getState();
  expect(
    (state as InProgressState).controllers.flow.current?.currentState?.name,
  ).toBe("EXT_2");

  // Attempt to resolve _after_ Player has transitioned
  resolver?.();

  // Should be same as prev
  state = player.getState();
  expect(
    (state as InProgressState).controllers.flow.current?.currentState?.name,
  ).toBe("EXT_2");
});

describe("edge cases", () => {
  test("async action nodes not transitioning from navigation states with *", async () => {
    const player = new Player({
      plugins: [
        new ExternalActionPlugin(() => {
          return new Promise((resolve) => {
            setTimeout(() => {
              resolve("next");
            }, 100);
          });
        }),
      ],
    });

    player.hooks.expressionEvaluator.tap("test", (expEval) => {
      expEval.addExpressionFunction("testAsync", async (ctx, name) => {
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(name);
          }, 10);
        });
      });
    });

    player.start({
      id: "test-flow",
      data: {
        my: {
          puppy: "Ginger",
        },
      },
      views: [
        {
          id: "next",
          type: "test",
        },
        {
          id: "back",
          type: "test",
        },
        {
          id: "star",
          type: "test",
        },
      ],
      navigation: {
        BEGIN: "FLOW_1",
        FLOW_1: {
          startState: "ACTION_1",
          ACTION_1: {
            state_type: "ASYNC_ACTION",
            exp: "{{my.puppy}} = await(testAsync('Daisy'))",
            transitions: {
              Daisy: "EXTERNAL_1",
            },
            await: true,
          },
          EXTERNAL_1: {
            state_type: "EXTERNAL",
            ref: "view_1",
            param: {
              best: "{{my.puppy}}",
            },
            transitions: {
              next: "VIEW_1",
              back: "VIEW_2",
              "*": "VIEW_3",
            },
          },
          VIEW_1: {
            state_type: "VIEW",
            ref: "next",
            transitions: {
              "*": "END",
            },
          },
          VIEW_2: {
            state_type: "VIEW",
            ref: "back",
            transitions: {
              "*": "END",
            },
          },
          VIEW_3: {
            state_type: "VIEW",
            ref: "star",
            transitions: {
              "*": "END",
            },
          },
        },
      },
    });

    await vitest.waitFor(() =>
      expect(player.getState().status).toBe("in-progress"),
    );

    let currentState: NamedState | undefined;

    await waitFor(() => {
      const state = player.getState();
      currentState = (state as InProgressState).controllers.flow.current
        ?.currentState;
      expect(currentState?.name).toBe("EXTERNAL_1");
    });

    await waitFor(() => {
      const state = player.getState();
      currentState = (state as InProgressState).controllers.flow.current
        ?.currentState;
      expect(currentState?.name).toBe("VIEW_1");
    });
  });
});
