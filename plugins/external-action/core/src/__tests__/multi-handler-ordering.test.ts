import { describe, expect, test, vi } from "vitest";
import type { Flow } from "@player-ui/player";
import { Player } from "@player-ui/player";
import { ExternalActionPlugin } from "..";

/**
 * Tests for ExternalActionPlugin behavior when multiple plugin instances
 * are registered on the same Player.
 *
 * In plugin architectures, a host application may register its own
 * ExternalActionPlugin alongside one from an embedded component. The
 * interaction between these handlers matters: if the first handler
 * resolves synchronously, the second handler should not execute its
 * side effects, because the external state has already been resolved.
 */
const externalFlow: Flow = {
  id: "test-external-action-ordering",
  data: {
    transitionValue: "Next",
  },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "EXT_1",
      EXT_1: {
        state_type: "EXTERNAL",
        ref: "test-action",
        transitions: {
          first: "END_FIRST",
          second: "END_SECOND",
        },
      },
      END_FIRST: {
        state_type: "END",
        outcome: "first-handled",
      },
      END_SECOND: {
        state_type: "END",
        outcome: "second-handled",
      },
    },
  },
};

describe("ExternalActionPlugin with multiple instances", () => {
  test("when first handler resolves synchronously, second handler should not be invoked", async () => {
    const firstHandler = vi.fn().mockReturnValue("first");
    const secondHandler = vi.fn().mockReturnValue("second");

    const player = new Player({
      plugins: [
        new ExternalActionPlugin(firstHandler),
        new ExternalActionPlugin(secondHandler),
      ],
    });

    const result = await player.start(externalFlow);

    // The first handler should win
    expect(result.endState.outcome).toBe("first-handled");
    expect(firstHandler).toHaveBeenCalledTimes(1);

    // The second handler should NOT be called — the first handler already
    // resolved the external state, so invoking the second handler would
    // cause unexpected side effects in the second plugin.
    expect(secondHandler).not.toHaveBeenCalled();
  });

  test("when first handler resolves async, second handler starts but the loser does not transition", async () => {
    const callOrder: string[] = [];

    const firstHandler = vi.fn().mockImplementation(async () => {
      callOrder.push("first-start");
      await new Promise((r) => setTimeout(r, 10));
      callOrder.push("first-resolve");
      return "first";
    });

    const secondHandler = vi.fn().mockImplementation(async () => {
      callOrder.push("second-start");
      await new Promise((r) => setTimeout(r, 50));
      callOrder.push("second-resolve");
      return "second";
    });

    const player = new Player({
      plugins: [
        new ExternalActionPlugin(firstHandler),
        new ExternalActionPlugin(secondHandler),
      ],
    });

    const result = await player.start(externalFlow);

    // The faster handler should win the transition
    expect(result.endState.outcome).toBe("first-handled");

    // Both handlers started (since both are async, they race)
    expect(callOrder).toContain("first-start");
    expect(callOrder).toContain("second-start");

    // First should have resolved
    expect(callOrder).toContain("first-resolve");

    // If second also resolved, first must have resolved before it
    if (callOrder.includes("second-resolve")) {
      expect(callOrder.indexOf("first-resolve")).toBeLessThan(
        callOrder.indexOf("second-resolve"),
      );
    }
  });

  test("when first handler returns undefined (delegates), second handler should resolve the state", async () => {
    const firstHandler = vi.fn().mockReturnValue(undefined);
    const secondHandler = vi.fn().mockReturnValue("second");

    const player = new Player({
      plugins: [
        new ExternalActionPlugin(firstHandler),
        new ExternalActionPlugin(secondHandler),
      ],
    });

    const result = await player.start(externalFlow);

    // First handler delegated by returning undefined
    expect(firstHandler).toHaveBeenCalledTimes(1);
    // Second handler should pick it up
    expect(secondHandler).toHaveBeenCalledTimes(1);
    expect(result.endState.outcome).toBe("second-handled");
  });
});
