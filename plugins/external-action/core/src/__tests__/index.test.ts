import { expect, test, vitest, describe } from "vitest";
import type { Flow, InProgressState, NamedState } from "@player-ui/player";
import { Player } from "@player-ui/player";
import { ExternalActionPlugin } from "..";
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
        testProperty: "testValue",
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

const refMatch = { ref: "test-1" };
const refAndDataMatch = { ref: "test-1", testProperty: "testValue" };

test("handles the external state", async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin([
        [
          refMatch,
          (state, options) => {
            return options.data.get("transitionValue");
          },
        ],
      ]),
    ],
  });

  const completed = await player.start(externalFlow as Flow);

  expect(completed.endState.outcome).toBe("FWD");
});

test("thrown errors will fail player", async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin([
        [
          refMatch,
          (state, options) => {
            throw new Error("Bad Code");
          },
        ],
      ]),
    ],
  });

  await expect(player.start(externalFlow as Flow)).rejects.toThrow();

  expect(player.getState().status).toBe("error");
});

test("works async", async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin([
        [
          refMatch,
          () => {
            return Promise.resolve("Prev");
          },
        ],
      ]),
    ],
  });

  const completed = await player.start(externalFlow as Flow);

  expect(completed.endState.outcome).toBe("BCK");
});

test("allows multiple plugins - last one wins", async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin([
        [
          refMatch,
          () => {
            return "Next";
          },
        ],
      ]),
      new ExternalActionPlugin([
        [
          refMatch,
          () => {
            return "Prev";
          },
        ],
      ]),
    ],
  });

  const completed = await player.start(externalFlow as Flow);

  // Last handler registered wins (Prev)
  expect(completed.endState.outcome).toBe("BCK");
});

test("logs debug message when replacing handler", async () => {
  const mockDebug = vitest.fn();

  const player = new Player({
    plugins: [
      new ExternalActionPlugin([
        [
          refMatch,
          () => {
            return "Next";
          },
        ],
      ]),
      new ExternalActionPlugin([
        [
          refMatch,
          () => {
            return "Prev";
          },
        ],
      ]),
    ],
    logger: {
      trace: vitest.fn(),
      debug: mockDebug,
      info: vitest.fn(),
      warn: vitest.fn(),
      error: vitest.fn(),
    },
  });

  await player.start(externalFlow as Flow);

  // Should have logged that the handler was replaced
  // Check if any of the calls match our expected message
  const replacementCalls = mockDebug.mock.calls.filter(
    (call) =>
      call[0] === "Registry: Replacing existing entry for key " &&
      call[1] === refMatch,
  );
  expect(replacementCalls.length).toBeGreaterThan(0);
});

test("different plugins, more specific match overrides less specific match", async () => {
  const player = new Player({
    plugins: [
      new ExternalActionPlugin([
        [
          refAndDataMatch,
          () => {
            return "Next";
          },
        ],
      ]),
      new ExternalActionPlugin([
        [
          refMatch,
          () => {
            return "Prev";
          },
        ],
      ]),
    ],
  });

  const completed = await player.start(externalFlow as Flow);

  // More specific match (refAndDataMatch) should win, returning "Next" which leads to outcome "FWD"
  expect(completed.endState.outcome).toBe("FWD");
});

test("within same plugin, more specific match overrides less specific match", async () => {
  const moreSpecificHandlerCalled = vitest.fn();
  const lessSpecificHandlerCalled = vitest.fn();

  const player = new Player({
    plugins: [
      new ExternalActionPlugin([
        [
          refAndDataMatch,
          () => {
            moreSpecificHandlerCalled();
            return "Next";
          },
        ],
        [
          refMatch,
          () => {
            lessSpecificHandlerCalled();
            return "Prev";
          },
        ],
      ]),
    ],
  });

  const completed = await player.start(externalFlow as Flow);

  // More specific match should win regardless of insertion order
  expect(moreSpecificHandlerCalled).toHaveBeenCalledOnce();
  expect(lessSpecificHandlerCalled).not.toHaveBeenCalled();
  expect(completed.endState.outcome).toBe("FWD");
});

test("only transitions if player still on this external state", async () => {
  let resolver: (() => void) | undefined;
  const player = new Player({
    plugins: [
      new ExternalActionPlugin([
        [
          refMatch,
          (state, options) => {
            return new Promise((res) => {
              // Only save resolver for first external action
              if (!resolver) {
                resolver = () => {
                  res(options.data.get("transitionValue"));
                };
              }
            });
          },
        ],
      ]),
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
        new ExternalActionPlugin([
          [
            { ref: "view_1" },
            () => {
              return new Promise((resolve) => {
                setTimeout(() => {
                  resolve("next");
                }, 100);
              });
            },
          ],
        ]),
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

  test("no handler registered for external state - no transition occurs", async () => {
    // Create a player with NO handlers registered
    const player = new Player({
      plugins: [
        new ExternalActionPlugin([
          // Register handler for a different ref - not matching our external state
          [{ ref: "different-ref" }, () => "Next"],
        ]),
      ],
    });

    const started = player.start(externalFlow as Flow);

    // Wait for player to reach the external state
    await vitest.waitFor(() =>
      expect(player.getState().status).toBe("in-progress"),
    );

    // Get the current state
    const state = player.getState() as InProgressState;
    const currentState = state.controllers.flow.current?.currentState;

    // Should be stuck on the external state
    expect(currentState?.name).toBe("EXT_1");
    expect(currentState?.value.state_type).toBe("EXTERNAL");

    // Wait a bit to ensure no transition occurs
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Should still be on the external state (no transition occurred)
    const laterState = player.getState() as InProgressState;
    const laterCurrentState = laterState.controllers.flow.current?.currentState;
    expect(laterCurrentState?.name).toBe("EXT_1");
    expect(laterCurrentState?.value.state_type).toBe("EXTERNAL");

    // Clean up - manually transition to end the flow
    laterState.controllers.flow.transition("Next");
    await started;
  });
});

describe("Type Safety", () => {
  test("handlers with invalid matches (no ref) should not be triggered at runtime", async () => {
    const invalidHandler1Called = vitest.fn();
    const invalidHandler2Called = vitest.fn();
    const validHandlerCalled = vitest.fn();
    const warnSpy = vitest.fn();

    const player = new Player({
      plugins: [
        new ExternalActionPlugin([
          // Invalid match - empty object (TypeScript error suppressed for testing)
          // @ts-expect-error - testing runtime behavior with invalid match
          [{}, () => {
            invalidHandler1Called();
            return "Next";
          }],
          // Invalid match - missing ref (TypeScript error suppressed for testing)
          // @ts-expect-error - testing runtime behavior with invalid match
          [{ testProperty: "testValue" }, () => {
            invalidHandler2Called();
            return "Next";
          }],
          // Valid match - has ref
          [{ ref: "test-1" }, () => {
            validHandlerCalled();
            return "Next";
          }],
        ]),
      ],
      logger: {
        trace: vitest.fn(),
        debug: vitest.fn(),
        info: vitest.fn(),
        warn: warnSpy,
        error: vitest.fn(),
      },
    });

    const completed = await player.start(externalFlow as Flow);

    // Warnings should have been logged for handlers with invalid matches (2 warnings)
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("An external action match is missing the 'ref' property")
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("This handler will be ignored")
    );

    // The handlers with invalid matches should NOT have been called
    expect(invalidHandler1Called).not.toHaveBeenCalled();
    expect(invalidHandler2Called).not.toHaveBeenCalled();
    
    // The valid handler should have been called
    expect(validHandlerCalled).toHaveBeenCalledTimes(1);
    
    // Flow should complete successfully using the valid handler
    expect(completed.endState.outcome).toBe("FWD");
  });
});