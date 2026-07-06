import { describe, expect, test, vitest } from "vitest";
import { Player } from "..";
import type { Flow, PlayerPlugin, InProgressState } from "..";

/** Minimal Flow used to short-circuit setupFlow. */
const flowFor = (id: string): Flow => ({
  id,
  views: [{ id: "v1", type: "text", value: "hi" }],
  data: {},
  navigation: {
    BEGIN: "F",
    F: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "v1",
        transitions: { "*": "END" },
      },
      END: { state_type: "END", outcome: "done" },
    },
  },
});

describe("transformContent hook", () => {
  test("default format 'player' passes the payload through unchanged", async () => {
    const player = new Player();
    const flow = flowFor("plain");
    player.start(flow);
    const state = player.getState() as InProgressState;
    expect(state.flow).toBe(flow);
  });

  test("a plugin tapping for a custom format transforms the payload", async () => {
    const greetPlugin: PlayerPlugin = {
      name: "greet",
      apply(p) {
        p.hooks.transformContent.tap("greet", (content, meta) => {
          if (meta.format !== "greet") return undefined;
          const { message } = content as { message: string };
          return { ...flowFor("greet"), data: { message } };
        });
      },
    };

    const player = new Player({ plugins: [greetPlugin] });
    player.start({ message: "Hello world" }, { format: "greet" });

    const state = player.getState() as InProgressState;
    await vitest.waitFor(() =>
      expect(state.controllers.view.currentView?.lastUpdate).toBeDefined(),
    );
    expect(state.controllers.data.get("message")).toBe("Hello world");
  });

  test("fires before resolveFlowContent", async () => {
    const order: string[] = [];

    const orderPlugin: PlayerPlugin = {
      name: "order",
      apply(p) {
        p.hooks.transformContent.tap("order", () => {
          order.push("transformContent");
          // Return undefined so Player's default "player" handler claims it.
          return undefined;
        });
        p.hooks.resolveFlowContent.tap("order", (c) => {
          order.push("resolveFlowContent");
          return c;
        });
      },
    };

    const player = new Player({ plugins: [orderPlugin] });
    player.start(flowFor("order"));

    expect(order).toEqual(["transformContent", "resolveFlowContent"]);
  });

  test("multiple format plugins coexist — only matching one transforms", async () => {
    const aPlugin: PlayerPlugin = {
      name: "a",
      apply(p) {
        p.hooks.transformContent.tap("a", (c, meta) =>
          meta.format === "a" ? flowFor("from-a") : undefined,
        );
      },
    };
    const bPlugin: PlayerPlugin = {
      name: "b",
      apply(p) {
        p.hooks.transformContent.tap("b", (c, meta) =>
          meta.format === "b" ? flowFor("from-b") : undefined,
        );
      },
    };

    const player = new Player({ plugins: [aPlugin, bPlugin] });
    player.start({ raw: true }, { format: "b" });

    const state = player.getState() as InProgressState;
    expect(state.flow.id).toBe("from-b");
  });

  test("version is plumbed from StartOptions to the hook's meta arg", () => {
    const versions: Array<string | undefined> = [];
    const probe: PlayerPlugin = {
      name: "probe",
      apply(p) {
        p.hooks.transformContent.tap("probe", (c, meta) => {
          versions.push(meta.version);
          // For format !== "demo", return undefined so the default path runs.
          if (meta.format !== "demo") return undefined;
          return flowFor("demo");
        });
      },
    };

    const player = new Player({ plugins: [probe] });
    player.start({ x: 1 }, { format: "demo", version: "2" });
    player.start({ x: 1 }, { format: "demo", version: "1" });
    player.start(flowFor("noversion"));

    expect(versions).toEqual(["2", "1", undefined]);
  });

  test("errors when no tap transforms an unknown format into a Flow", async () => {
    const player = new Player();
    const result = player.start({ some: "content" }, { format: "unknown" });
    await expect(result).rejects.toThrow(/format "unknown"/);
  });
});
