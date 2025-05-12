import { it, expect } from "vitest";
import { FlowExpressionsPlugin } from "../index";
import { Flow, InProgressState, Player } from "@player-ui/player";

it("should register local expressions with the correct prefix", () => {
  const player = new Player({ plugins: [new FlowExpressionsPlugin()] });

  const flow: Flow = {
    id: "test",
    expressions: {
      test: "{{foo.bar}} == true",
      test2: ["{{local.called}} = true", "{{foo.bar}}"],
    },
    views: [
      {
        id: "VIEW_1",
        type: "view",
        title: "Value: @[test()]@",
        other: "Value2: @[test2()]@",
      },
    ],
    data: {
      foo: {
        bar: true,
      },
    },
    navigation: {
      BEGIN: "FLOW_1",
      FLOW_1: {
        startState: "VIEW_1",
        VIEW_1: {
          state_type: "VIEW",
          ref: "VIEW_1",
          transitions: {},
        },
      },
    },
  };

  player.start(flow);
  const latestView = (player.getState() as InProgressState).controllers.view
    .currentView?.lastUpdate;

  expect(latestView?.title).toBe("Value: true");
  expect(latestView?.other).toBe("Value2: true");
});
