import { test, expect } from "vitest";
import type { InProgressState } from "@player-ui/player";
import { Player } from "@player-ui/player";
import { ExpressionPlugin } from ".";

const minimal = {
  id: "minimal",
  views: [
    {
      id: "view-1",
      type: "info",
    },
  ],
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      onStart: 'testExp("arguments")',
      startState: "VIEW_1",
      VIEW_1: {
        ref: "view-1",
        state_type: "VIEW",
        transitions: {
          Next: "VIEW_2",
          "*": "END_Done",
        },
      },
    },
  },
};

test("loads an expression", () => {
  const player = new Player({
    plugins: [
      new ExpressionPlugin(
        new Map([
          [
            "testExp",
            (ctx, arg1) => {
              ctx.model.set([["foo.bar", `it works! ${arg1}`]]);
            },
          ],
        ]),
      ),
    ],
  });

  player.start(minimal as any);
  const state = player.getState() as InProgressState;

  expect(state.controllers.data.get("foo")).toStrictEqual({
    bar: "it works! arguments",
  });
});
