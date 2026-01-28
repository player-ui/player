import { describe, it, test, expect, vitest } from "vitest";
import { FlowInstance } from "..";
import { resolveErrorState } from "../../error/utils";

test("starts the right state", () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
    View1: {
      state_type: "VIEW",
      ref: "foo",
      transitions: {
        Next: "View2",
      },
    },
  } as const);

  flow.start();
  expect(flow.currentState!.name).toBe("View1");
});

test("works with just END state", async () => {
  const flow = new FlowInstance("flow", {
    startState: "END_done",
    END_before_topic: { state_type: "END", outcome: "BACK" },
    END_done: { state_type: "END", outcome: "doneWithTopic" },
  } as const);

  expect(await flow.start()).toStrictEqual({
    state_type: "END",
    outcome: "doneWithTopic",
  });
});

test("simple transitions between states", () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
    View1: {
      state_type: "VIEW",
      ref: "foo",

      transitions: {
        Next: "View2",
      },
    },
    View2: {
      state_type: "VIEW",
      ref: "foo",
      transitions: {
        Prev: "View1",
      },
    },
  } as const);

  flow.start();
  expect(flow.currentState!.name).toBe("View1");
  flow.transition("Next");
  expect(flow.currentState!.name).toBe("View2");
  flow.transition("Prev");
  expect(flow.currentState!.name).toBe("View1");
});

test("transition from end state returns", () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
    View1: {
      state_type: "VIEW",
      ref: "foo",
      transitions: {
        Next: "Done1",
      },
    },
    Done1: {
      state_type: "END",
      outcome: "foo-bar",
    },
  });

  flow.start();
  flow.transition("Next");
  expect(() => flow.transition("Prev")).not.toThrowError();
});

test("fails when theres no startState", async () => {
  const flow = new FlowInstance("flow", {
    View1: {
      state_type: "Foo",
      transitions: {},
    },
  } as any);

  await expect(flow.start()).rejects.toThrowError(
    "No 'startState' defined for flow",
  );
});

test("uses * as fallback transition", () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
    View1: {
      state_type: "VIEW",
      ref: "foo",
      transitions: {
        "*": "SpecialView",
      },
    },
    SpecialView: {
      ref: "foo",
      state_type: "VIEW",
      transitions: {},
    },
  });

  flow.start();
  expect(flow.currentState!.name).toBe("View1");
  flow.transition("Prev");
  expect(flow.currentState!.name).toBe("SpecialView");
});

test("Do not throw exception when no transitions", () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
    View1: {
      state_type: "VIEW",
      ref: "foo",
      transitions: {
        Next: "View2",
      },
    },
  });

  flow.start();
  expect(flow.currentState!.name).toBe("View1");
  expect(() => flow.transition("Prev")).not.toThrowError();
});

test("Fails to transition when not started", () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
    View1: {
      state_type: "VIEW",
      ref: "foo",
      transitions: {
        Next: "View2",
      },
    },
  });

  expect(() => flow.transition("foo")).toThrowError();
});

test("Fails to transition during another transition", async () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
    View1: {
      state_type: "VIEW",
      onStart: "foo bar",
      ref: "foo",
      transitions: {
        Next: "View2",
      },
    },
    View2: {
      state_type: "VIEW",
      ref: "bar",
      transitions: {
        Next: "View3",
      },
    },
  });

  let deferredVar: string;

  const transition = () => {
    try {
      flow.transition("Next");
      return "foo";
    } catch (_error: unknown) {
      return "bar";
    }
  };

  flow.hooks.resolveTransitionNode.intercept({
    call: (nextState) => {
      if (nextState?.onStart) {
        deferredVar = transition();
      }
    },
  });

  flow.start();

  await vitest.waitFor(() => {
    expect(deferredVar).toBeDefined();
  });

  expect(deferredVar!).toBe("bar");
});

describe("promise api", () => {
  it("resolves when were done", async () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      View1: {
        state_type: "VIEW",
        ref: "foo",
        transitions: {
          Next: "Done1",
        },
      },
      Done1: {
        state_type: "END",
        outcome: "foo-bar",
      },
    });

    const flowProm = flow.start();
    flow.transition("Next");
    const result = await flowProm;
    expect(result.state_type).toBe("END");
    expect(result.outcome).toBe("foo-bar");
  });
});

test("reuses the same promise if started again", async () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
    View1: {
      state_type: "VIEW",
      ref: "foo",
      transitions: { "*": "End1" },
    },
    End1: {
      state_type: "END",
      outcome: "bar",
    },
  });

  flow.start();
  flow.transition("foo");
  const result = await flow.start();
  expect(result.outcome).toBe("bar");
});

test("calls onStart hook", async () => {
  const flow = new FlowInstance("flow", {
    onStart: "foo bar",
  } as any);
  const hook = vitest.fn();
  flow.hooks.onStart.tap("test", hook);
  const result = flow.start();
  expect(hook).toBeCalledWith("foo bar");

  await expect(result).rejects.toThrowError("No 'startState' defined for flow");
});

test("calls the onEnd hook", async () => {
  const flow = new FlowInstance("flow", {
    onEnd: "foo bar",
    startState: "FOO",
    FOO: {
      state_type: "END",
      outcome: "done",
    },
  });
  const hook = vitest.fn();

  flow.hooks.onEnd.tap("test", hook);
  const result = flow.start();
  expect(hook).toBeCalledWith("foo bar");
  expect(await result).toStrictEqual({
    state_type: "END",
    outcome: "done",
  });
});

test("keeps current state if skipped", () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
    View1: {
      state_type: "VIEW",
      ref: "foo",
      transitions: {
        Next: "View2",
      },
    },
    View2: {
      state_type: "VIEW",
      ref: "bar",
      transitions: {},
    },
  });

  flow.hooks.skipTransition.tap("test", (curr) => curr !== undefined);
  flow.start();
  expect(flow.currentState!.name).toBe("View1");
  flow.transition("Next");
  expect(flow.currentState!.name).toBe("View1");
});

test("fails to transition if not started", () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
  });

  expect(() => flow.transition("foo")).toThrowError();
});

test("fails if no transition", () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
    View1: {
      state_type: "VIEW",
      ref: "foo",
    },
  } as any);
  flow.start();
  expect(() => flow.transition("foo")).toThrowError();
});

test("fails if no startState points to unknown state", async () => {
  const flow = new FlowInstance("flow", {
    startState: "View2",
  } as any);

  await expect(flow.start()).rejects.toThrowError(
    "No flow definition for: View2 was found.",
  );
});

test("force transition", () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
    View1: {
      state_type: "VIEW",
      ref: "foo",
      transitions: {
        Next: "Done1",
      },
    },
    Done1: {
      state_type: "END",
      outcome: "foo-bar",
    },
  });

  flow.start();
  flow.hooks.skipTransition.tap("tst", () => true);
  expect(flow.currentState?.name).toBe("View1");

  // Transition without the force flag
  flow.transition("Next");

  // Should stay on the same page
  expect(flow.currentState?.name).toBe("View1");

  flow.transition("Next", { force: true });

  // Forced transition ignore the skip hook
  expect(flow.currentState?.name).toBe("Done1");
});

test("fails if transitioning to unknown state", () => {
  const flow = new FlowInstance("flow", {
    startState: "View1",
    View1: {
      state_type: "VIEW",
      ref: "foo",
      transitions: {
        Next: "Done1",
      },
    },
    Done1: {
      outcome: "foo-bar",
    },
  } as any);

  flow.start();

  expect(flow.currentState?.name).toBe("View1");
  flow.transition("Next");
  expect(flow.currentState?.name).toBe("View1");
});

describe("getErrorTransition", () => {
  test("returns undefined when flow has no errorState", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          next: "End",
        },
      },
      End: {
        state_type: "END",
        outcome: "done",
      },
    });

    flow.start();
    const result = resolveErrorState(flow.getFlowErrorState());

    expect(result).toBeUndefined();
    expect(flow.currentState?.name).toBe("View1");
  });

  test("returns string errorState", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      errorState: "error",
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          error: "ErrorView",
          next: "End",
        },
      },
      ErrorView: {
        state_type: "VIEW",
        ref: "error-view",
        transitions: {
          retry: "View1",
        },
      },
      End: {
        state_type: "END",
        outcome: "done",
      },
    });

    flow.start();
    const result = resolveErrorState(flow.getFlowErrorState());

    expect(result).toBe("error");
  });

  test("returns matching errorType in dictionary", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      errorState: {
        network: "networkError",
        validation: "validationError",
        "*": "genericError",
      },
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          networkError: "NetworkError",
          validationError: "ValidationError",
          genericError: "GenericError",
        },
      },
      NetworkError: {
        state_type: "VIEW",
        ref: "network-error",
        transitions: {},
      },
      ValidationError: {
        state_type: "VIEW",
        ref: "validation-error",
        transitions: {},
      },
      GenericError: {
        state_type: "VIEW",
        ref: "generic-error",
        transitions: {},
      },
    });

    flow.start();
    const result = resolveErrorState(flow.getFlowErrorState(), "network");

    expect(result).toBe("networkError");
  });

  test("uses wildcard when errorType doesn't match", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      errorState: {
        network: "networkError",
        "*": "genericError",
      },
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          networkError: "NetworkError",
          genericError: "GenericError",
        },
      },
      NetworkError: {
        state_type: "VIEW",
        ref: "network-error",
        transitions: {},
      },
      GenericError: {
        state_type: "VIEW",
        ref: "generic-error",
        transitions: {},
      },
    });

    flow.start();
    const result = resolveErrorState(flow.getFlowErrorState(), "unknown");

    expect(result).toBe("genericError");
  });

  test("returns undefined when no match and no wildcard", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      errorState: {
        network: "networkError",
      },
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          networkError: "NetworkError",
        },
      },
      NetworkError: {
        state_type: "VIEW",
        ref: "network-error",
        transitions: {},
      },
    });

    flow.start();
    const result = resolveErrorState(flow.getFlowErrorState(), "unknown");

    expect(result).toBeUndefined();
  });
});

describe("Flow-level transitions", () => {
  test("flowTransition falls back to flow-level transitions", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      transitions: {
        error: "ErrorView",
        "*": "FallbackView",
      },
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          next: "End",
        },
      },
      ErrorView: {
        state_type: "VIEW",
        ref: "error-view",
        transitions: {
          retry: "View1",
        },
      },
      FallbackView: {
        state_type: "VIEW",
        ref: "fallback-view",
        transitions: {
          back: "View1",
        },
      },
      End: {
        state_type: "END",
        outcome: "done",
      },
    });

    flow.start();
    expect(flow.currentState?.name).toBe("View1");

    // flowTransition should use flow-level transitions since "error" is not in View1.transitions
    flow.flowTransition("error");
    expect(flow.currentState?.name).toBe("ErrorView");
  });

  test("flowTransition uses flow-level transitions only", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      transitions: {
        error: "FlowErrorView",
      },
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          next: "End",
          error: "NodeErrorView",
        },
      },
      NodeErrorView: {
        state_type: "VIEW",
        ref: "node-error-view",
        transitions: {
          retry: "View1",
        },
      },
      FlowErrorView: {
        state_type: "VIEW",
        ref: "flow-error-view",
        transitions: {
          retry: "View1",
        },
      },
      End: {
        state_type: "END",
        outcome: "done",
      },
    });

    flow.start();
    expect(flow.currentState?.name).toBe("View1");

    // flowTransition should ONLY use flow-level, not node-level
    flow.flowTransition("error");
    expect(flow.currentState?.name).toBe("FlowErrorView");
  });

  test("regular transition does NOT use flow-level transitions", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      transitions: {
        error: "ErrorView",
      },
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          next: "End",
        },
      },
      ErrorView: {
        state_type: "VIEW",
        ref: "error-view",
        transitions: {
          retry: "View1",
        },
      },
      End: {
        state_type: "END",
        outcome: "done",
      },
    });

    flow.start();
    expect(flow.currentState?.name).toBe("View1");

    // Regular transition should NOT fall back to flow-level
    flow.transition("error");
    // Should still be on View1 because transition just warns and returns
    expect(flow.currentState?.name).toBe("View1");
  });
});
