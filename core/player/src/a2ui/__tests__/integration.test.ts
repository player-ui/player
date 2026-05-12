import { describe, expect, test, vitest } from "vitest";
import { Player } from "../..";
import type { InProgressState } from "../../types";
import type { A2UISnapshot } from "../types";

describe("Player.start with format: 'a2ui'", () => {
  test("renders a flat A2UI snapshot as a nested resolved view", async () => {
    const snapshot: A2UISnapshot = {
      surfaceId: "greeting",
      dataModel: { message: "Hello from A2UI" },
      components: [
        { id: "root", component: "Column", children: ["header", "body"] },
        { id: "header", component: "Text", text: "Welcome" },
        { id: "body", component: "Card", child: "content" },
        {
          id: "content",
          component: "Text",
          text: { path: "/message" },
        },
      ],
    };

    const player = new Player();
    player.start(snapshot, { format: "a2ui" });

    const started = player.getState() as InProgressState;
    await vitest.waitFor(() =>
      expect(started.controllers.view.currentView?.lastUpdate).toBeDefined(),
    );

    const view = started.controllers.view.currentView!.lastUpdate as any;
    expect(view).toMatchObject({
      id: "greeting",
      type: "Column",
      children: [
        { asset: { id: "header", type: "Text", text: "Welcome" } },
        {
          asset: {
            id: "body",
            type: "Card",
            child: {
              asset: { id: "content", type: "Text", text: "message" },
            },
          },
        },
      ],
    });

    // The bound data is reachable via the binding string; the platform asset
    // would resolve it. Verify the binding round-trips.
    expect(started.controllers.data.get("message")).toBe("Hello from A2UI");
  });

  test("event action transitions to a named END state with that outcome", async () => {
    const snapshot: A2UISnapshot = {
      surfaceId: "form",
      dataModel: {},
      components: [
        {
          id: "root",
          component: "Button",
          text: "Go",
          action: { event: { name: "submit_form" } },
        },
      ],
    };

    const player = new Player();
    const completedPromise = player.start(snapshot, { format: "a2ui" });

    const started = player.getState() as InProgressState;
    await vitest.waitFor(() =>
      expect(started.controllers.view.currentView?.lastUpdate).toBeDefined(),
    );

    started.controllers.flow.transition("submit_form");

    const completed = await completedPromise;
    expect(completed.endState.outcome).toBe("submit_form");
  });

  test("event context is written into the data model before transition", async () => {
    const snapshot: A2UISnapshot = {
      surfaceId: "form",
      dataModel: { user: { id: "u-42" } },
      components: [
        {
          id: "root",
          component: "Button",
          text: "Go",
          action: {
            event: {
              name: "submit",
              context: { itemId: "i-99", user: { path: "/user/id" } },
            },
          },
        },
      ],
    };

    const player = new Player();
    const completedPromise = player.start(snapshot, { format: "a2ui" });

    const started = player.getState() as InProgressState;
    await vitest.waitFor(() =>
      expect(started.controllers.view.currentView?.lastUpdate).toBeDefined(),
    );

    const view = started.controllers.view.currentView!.lastUpdate as any;
    expect(view.value).toBe("submit");
    expect(view.exp).toEqual([
      '{{agent.event.context.itemId}} = "i-99"',
      "{{agent.event.context.user}} = {{user.id}}",
    ]);

    // Simulate what a platform Button asset does on click.
    started.controllers.expression.evaluate(view.exp);
    started.controllers.flow.transition("submit");

    const completed = await completedPromise;
    expect(completed.endState.outcome).toBe("submit");
    expect(completed.data).toMatchObject({
      agent: { event: { context: { itemId: "i-99", user: "u-42" } } },
    });
  });

  test("default format: 'player' path is untouched (regression)", async () => {
    const player = new Player();
    const completedPromise = player.start({
      id: "plain",
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

    const started = player.getState() as InProgressState;
    await vitest.waitFor(() =>
      expect(started.controllers.view.currentView?.lastUpdate).toBeDefined(),
    );
    started.controllers.flow.transition("Next");
    const completed = await completedPromise;
    expect(completed.endState.outcome).toBe("done");
  });
});
