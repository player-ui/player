import { describe, expect, test, vitest } from "vitest";
import type { PlayerPlugin, Player } from "@player-ui/player";
import { A2UIReactPlayer, type A2UISnapshot } from "..";

describe("A2UIReactPlayer", () => {
  test("auto-registers the A2UI plugin (content adapter)", async () => {
    const player = new A2UIReactPlayer();

    const snapshot: A2UISnapshot = {
      surfaceId: "greet",
      data: { message: "Hello" },
      components: [
        { id: "root", component: "Text", text: { path: "/message" } },
      ],
    };

    // If the A2UI content plugin were missing, transformContent would pass
    // the snapshot through unchanged and setupFlow would fail trying to read
    // `navigation` off it.
    player.start(snapshot, { format: "a2ui" });

    // Pull the underlying core player and confirm a view was set up.
    const state = (player.player as Player).getState() as {
      controllers?: { view?: { currentView?: { lastUpdate?: unknown } } };
    };
    await vitest.waitFor(() =>
      expect(state.controllers?.view?.currentView?.lastUpdate).toBeDefined(),
    );

    const view = state.controllers!.view!.currentView!.lastUpdate as {
      id: string;
      type: string;
    };
    expect(view.id).toBe("greet");
    expect(view.type).toBe("Text");
  });

  test("accepts and composes additional plugins", () => {
    let extraApplied = false;
    const extra: PlayerPlugin = {
      name: "extra",
      apply: () => {
        extraApplied = true;
      },
    };

    new A2UIReactPlayer({ plugins: [extra] });

    expect(extraApplied).toBe(true);
  });
});
