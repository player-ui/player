import { test, vitest, expect } from "vitest";
import type { FlowController, NamedState } from "../controllers";
import type { DataController } from "..";
import { Player } from "..";
import type { InProgressState } from "../types";
import { waitFor } from "@testing-library/react";
import { describe } from "node:test";

test("transitions on action nodes", async () => {
  const player = new Player();

  player.start({
    id: "test-flow",
    data: {
      my: {
        puppy: "Ginger",
      },
    },
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "ACTION_1",
        ACTION_1: {
          state_type: "ACTION",
          exp: "{{my.puppy}}",
          transitions: {
            Ginger: "EXTERNAL_1",
          },
        },
        EXTERNAL_1: {
          state_type: "EXTERNAL",
          ref: "view_1",
          param: {
            best: "{{my.puppy}}",
          },
          transitions: {},
        },
      },
    },
  });

  await vitest.waitFor(() =>
    expect(player.getState().status).toBe("in-progress"),
  );

  const state = player.getState();
  const currentState = (state as InProgressState).controllers.flow.current
    ?.currentState;
  expect(currentState?.name).toBe("EXTERNAL_1");
  expect(currentState?.value).toStrictEqual({
    state_type: "EXTERNAL",
    ref: "view_1",
    param: {
      best: "Ginger",
    },
    transitions: {},
  });
});

test("resolves data when transitioning", async () => {
  const player = new Player();

  let flowController: FlowController | undefined;

  player.hooks.flowController.tap("test", (fc) => {
    flowController = fc;
  });

  const flowResponse = player.start({
    id: "test-flow",
    views: [
      { id: "view-1", type: "view" },
      { id: "view-2", type: "view" },
    ],
    data: {
      viewNum: 2,
      outcomeData: "not good",
    },
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: "view-1",
          transitions: {
            Next: "VIEW_{{viewNum}}",
          },
        },
        VIEW_2: {
          state_type: "VIEW",
          ref: "view-{{viewNum}}",
          transitions: {
            "*": "END",
          },
        },
        END: {
          state_type: "END",
          outcome: "{{outcomeData}}",
        },
      },
    },
  });

  /** A helper to get the current view */
  const getView = () =>
    (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

  expect(getView()).toStrictEqual({
    id: "view-1",
    type: "view",
  });

  flowController?.transition("Next");

  expect(getView()).toStrictEqual({
    id: "view-2",
    type: "view",
  });

  flowController?.transition("Next");
  expect((await flowResponse).endState).toStrictEqual({
    state_type: "END",
    outcome: "not good",
  });
});

test("resolves dynamic view ids", () => {
  const player = new Player();

  player.start({
    id: "test-flow",
    views: [{ id: "view-1-{{name}}", type: "view" }],
    data: {
      viewNum: 1,
      name: "adam",
      outcomeData: "not good",
    },
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: "view-1-adam",
          transitions: {
            Next: "END",
          },
        },
        END: {
          state_type: "END",
          outcome: "{{outcomeData}}",
        },
      },
    },
  });

  const state = player.getState();

  expect(state.status).toBe("in-progress");
  expect(
    (state as InProgressState).controllers.view.currentView?.lastUpdate?.id,
  ).toBe("view-1-adam");
});

test("resolves data when completing", async () => {
  const player = new Player();

  let flowController: FlowController | undefined;
  let dataController: DataController | undefined;

  player.hooks.flowController.tap("test", (fc) => {
    flowController = fc;
  });

  player.hooks.dataController.tap("test", (dc) => {
    dataController = dc;
  });

  const flowResponse = player.start({
    id: "test-flow",
    views: [
      { id: "view-1", type: "view" },
      { id: "view-2", type: "view" },
    ],
    data: {
      viewNum: 2,
      outcomeData: "not good",
    },
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: "view-1",
          transitions: {
            Next: "VIEW_{{viewNum}}",
          },
        },
        VIEW_2: {
          state_type: "VIEW",
          ref: "view-{{viewNum}}",
          transitions: {
            "*": "END",
          },
        },
        END: {
          state_type: "END",
          outcome: "{{outcomeData}}",
        },
      },
    },
  });

  /** A helper to get the current view */
  const getView = () =>
    (player.getState() as InProgressState).controllers.view.currentView
      ?.lastUpdate;

  expect(getView()).toStrictEqual({
    id: "view-1",
    type: "view",
  });

  flowController?.transition("Next");

  dataController?.set({ testData: "testValue" });

  expect(getView()).toStrictEqual({
    id: "view-2",
    type: "view",
  });

  flowController?.transition("Next");
  const result = await flowResponse;

  expect(result.data).toStrictEqual({
    viewNum: 2,
    outcomeData: "not good",
    testData: "testValue",
  });
});

test("resolves param on end nodes", async () => {
  const player = new Player();

  const flowResponse = player.start({
    id: "test-flow",
    views: [
      { id: "view-1", type: "view" },
      { id: "view-2", type: "view" },
    ],
    data: {
      cat: {
        name: "Sam",
      },
    },
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: "view-1",
          transitions: {
            Next: "ACTION_1",
          },
        },
        ACTION_1: {
          state_type: "ACTION",
          exp: '{{cat.name}} = "FRODO"',
          transitions: {
            "*": "END",
          },
        },
        END: {
          state_type: "END",
          outcome: "favoritePet",
          param: "{{cat.name}}",
        },
      },
    },
  });

  (player.getState() as InProgressState).controllers.flow.transition("Next");

  expect((await flowResponse).endState).toStrictEqual({
    state_type: "END",
    outcome: "favoritePet",
    param: "FRODO",
  });
});

test("works with iffe flows", async () => {
  const player = new Player();
  const flowResponse = player.start({
    id: "first-end-flow",
    navigation: {
      BEGIN: "DoneWithTopicFlow",
      DoneWithTopicFlow: {
        startState: "END_done",
        END_before_topic: { state_type: "END", outcome: "BACK" },
        END_done: { state_type: "END", outcome: "doneWithTopic" },
      },
    },
  });

  expect((await flowResponse).endState).toStrictEqual({
    state_type: "END",
    outcome: "doneWithTopic",
  });
});

test("awaited async transitions", async () => {
  const player = new Player();
  let counter = 0;
  player.hooks.expressionEvaluator.tap("test", (expEval) => {
    expEval.addExpressionFunction("testAsync", async (ctx, name) => {
      counter += 1;
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
          transitions: {},
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

  expect(currentState?.value).toStrictEqual({
    state_type: "EXTERNAL",
    ref: "view_1",
    param: {
      best: "Daisy",
    },
    transitions: {},
  });

  expect(counter).toEqual(1);
});

test("unawaited async transitions", async () => {
  const player = new Player();

  const mockFn1 = vitest.fn();
  const mockFn2 = vitest.fn();

  player.hooks.expressionEvaluator.tap("test", (expEval) => {
    expEval.addExpressionFunction("testAsync", async (ctx, name) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(true);
        }, 10);
      });
    });
    expEval.addExpressionFunction("testTrue", mockFn1);
    expEval.addExpressionFunction("testFalse", mockFn2);
  });

  player.start({
    id: "test-flow",
    data: {
      my: {
        puppy: "Ginger",
      },
    },
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "ACTION_1",
        ACTION_1: {
          state_type: "ASYNC_ACTION",
          exp: "conditional(await(testAsync()), testTrue(), testFalse())",
          transitions: {
            "*": "EXTERNAL_1",
          },
          await: false,
        },
        EXTERNAL_1: {
          state_type: "EXTERNAL",
          ref: "view_1",
          transitions: {},
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
    expect(mockFn1).not.toHaveBeenCalled();
    expect(mockFn2).not.toHaveBeenCalled();
  });

  await waitFor(() => {
    expect(mockFn1).toHaveBeenCalled();
    expect(mockFn2).not.toHaveBeenCalled();
  });
});

describe("edge cases", () => {
  test("async action nodes firing async expressions more than once after a regular action node", async () => {
    const player = new Player();
    let asyncCounter = 0;
    let syncCounter = 0;
    player.hooks.expressionEvaluator.tap("test", (expEval) => {
      expEval.addExpressionFunction("testAsync", async (ctx, name) => {
        asyncCounter += 1;
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve(name);
          }, 10);
        });
      });
      expEval.addExpressionFunction("testSync", (ctx) => {
        syncCounter += 1;
        return "foo";
      });
    });

    player.start({
      id: "test-flow",
      data: {
        my: {
          puppy: "Ginger",
        },
      },
      navigation: {
        BEGIN: "FLOW_1",
        FLOW_1: {
          startState: "ACTION_1",
          ACTION_1: {
            state_type: "ACTION",
            exp: "{{something}} = testSync()",
            transitions: {
              "*": "ACTION_2",
            },
          },
          ACTION_2: {
            state_type: "ACTION",
            exp: "{{something}} = testSync()",
            transitions: {
              "*": "ACTION_3",
            },
          },
          ACTION_3: {
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
            transitions: {},
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

    expect(currentState?.value.ref).toStrictEqual("view_1");

    expect(asyncCounter).toEqual(1);
    expect(syncCounter).toEqual(2);
  });

  test("async action nodes only transition when the async action is resolved", async () => {
    const player = new Player();
    let expressionResolve: (val: any) => void;

    player.hooks.expressionEvaluator.tap("test", (expEval) => {
      expEval.addExpressionFunction("testAsync", async (ctx, name) => {
        return new Promise((resolve) => {
          expressionResolve = resolve;
        });
      });
    });

    player.start({
      id: "test-flow",
      views: [
        {
          id: "test",
          type: "test",
        },
      ],
      data: {
        my: {
          puppy: "Ginger",
        },
      },
      navigation: {
        BEGIN: "FLOW_1",
        FLOW_1: {
          startState: "ACTION_1",
          ACTION_1: {
            state_type: "ASYNC_ACTION",
            exp: "{{my.puppy}} = await(testAsync('Daisy'))",
            transitions: {
              "*": "VIEW_1",
            },
            await: true,
          },
          VIEW_1: {
            state_type: "VIEW",
            ref: "test",
            transitions: {
              "*": "END",
            },
          },
          END: {
            state_type: "END",
            outcome: "done",
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
      expect(state.status).toBe("in-progress");
      currentState = (state as InProgressState).controllers.flow.current
        ?.currentState;
      expect(currentState?.name).toBe("ACTION_1");
      expressionResolve("foo");
    });

    await waitFor(() => {
      const state = player.getState();
      currentState = (state as InProgressState).controllers.flow.current
        ?.currentState;
      expect(currentState?.name).toBe("VIEW_1");
    });
  });
});
