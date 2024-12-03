import { expect, test } from "vitest";
import type { InProgressState } from "@player-ui/player";
import { Player } from "@player-ui/player";
import { makeFlow } from "@player-ui/make-flow";
import { CommonExpressionsPlugin } from "..";

test("works in real life", () => {
  const flow = makeFlow({
    id: "view-1",
    type: "info",
    fields: {
      asset: {
        id: "input-1",
        type: "text",
        value: "@[titleCase('hello world')]@",
      },
    },
  });

  const player = new Player({
    plugins: [new CommonExpressionsPlugin()],
  });

  player.start(flow);

  const state = player.getState() as InProgressState;

  expect(
    state.controllers.view.currentView?.lastUpdate?.fields.asset.value,
  ).toBe("Hello World");
});
