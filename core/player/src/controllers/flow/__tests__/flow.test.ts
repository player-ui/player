import { describe, it, test, expect, vitest } from "vitest";
import { FlowInstance } from "..";

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

describe("transitionToErrorState", () => {
  test("returns false when flow has no errorState", () => {
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
    const result = flow.transitionToErrorState();

    expect(result).toBe(false);
    expect(flow.currentState?.name).toBe("View1");
  });

  test("navigates to string errorState", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      errorState: "ErrorView",
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
    const result = flow.transitionToErrorState();

    expect(result).toBe(true);
    expect(flow.currentState?.name).toBe("ErrorView");
  });

  test("navigates to matching errorType in dictionary", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      errorState: {
        network: "NetworkError",
        validation: "ValidationError",
        "*": "GenericError",
      },
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {},
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
    const result = flow.transitionToErrorState("network");

    expect(result).toBe(true);
    expect(flow.currentState?.name).toBe("NetworkError");
  });

  test("uses wildcard when errorType doesn't match", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      errorState: {
        network: "NetworkError",
        "*": "GenericError",
      },
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {},
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
    const result = flow.transitionToErrorState("unknown");

    expect(result).toBe(true);
    expect(flow.currentState?.name).toBe("GenericError");
  });

  test("returns false when no match and no wildcard", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      errorState: {
        network: "NetworkError",
      },
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {},
      },
      NetworkError: {
        state_type: "VIEW",
        ref: "network-error",
        transitions: {},
      },
    });

    flow.start();
    const result = flow.transitionToErrorState("unknown");

    expect(result).toBe(false);
    expect(flow.currentState?.name).toBe("View1");
  });

  test("bypasses transition map", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      errorState: "ErrorView",
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {
          next: "View2",
          // Note: NO "ErrorView" in transitions
        },
      },
      View2: {
        state_type: "VIEW",
        ref: "view-2",
        transitions: {},
      },
      ErrorView: {
        state_type: "VIEW",
        ref: "error-view",
        transitions: {},
      },
    });

    flow.start();
    const result = flow.transitionToErrorState();

    expect(result).toBe(true);
    expect(flow.currentState?.name).toBe("ErrorView");
  });

  test("does not trigger skipTransition hook", () => {
    const flow = new FlowInstance("flow", {
      startState: "View1",
      errorState: "ErrorView",
      View1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: {},
      },
      ErrorView: {
        state_type: "VIEW",
        ref: "error-view",
        transitions: {},
      },
    });

    const skipHook = vitest.fn(() => true);
    flow.hooks.skipTransition.tap("test", skipHook);

    flow.start();
    const result = flow.transitionToErrorState();

    expect(result).toBe(true);
    expect(flow.currentState?.name).toBe("ErrorView");
    expect(skipHook).not.toHaveBeenCalled();
  });
});
