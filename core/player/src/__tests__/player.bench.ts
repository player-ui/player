import { bench, describe } from "vitest";
import { Player } from "..";
import type { InProgressState } from "../types";

/** A minimal single-view flow, built fresh each call to avoid cross-run mutation */
const makeMinimalFlow = () => ({
  id: "minimal-flow",
  views: [
    {
      id: "view-1",
      type: "text",
      value: "Hello world",
    },
  ],
  data: {},
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: { "*": "END_Done" },
      },
      END_Done: { state_type: "END", outcome: "done" },
    },
  },
});

/** A data-bound view so a data set forces a real re-resolution */
const makeDataFlow = () => ({
  id: "data-flow",
  views: [
    {
      id: "view-1",
      type: "view",
      title: { asset: { id: "t", type: "text", value: "{{user.name}}'s form" } },
      label: { asset: { id: "l", type: "text", value: "count is {{count}}" } },
      subtitle: {
        asset: { id: "s", type: "text", value: "{{user.name}} ({{count}})" },
      },
    },
  ],
  data: { count: 0, user: { name: "Ada" } },
  navigation: {
    BEGIN: "FLOW_1",
    FLOW_1: {
      startState: "VIEW_1",
      VIEW_1: {
        state_type: "VIEW",
        ref: "view-1",
        transitions: { "*": "END_Done" },
      },
      END_Done: { state_type: "END", outcome: "done" },
    },
  },
});

describe("Player.start", () => {
  // Full engine setup + first view resolution. The returned promise stays
  // pending in the VIEW state, which is fine — we measure the synchronous
  // start cost, not flow completion.
  bench("minimal flow (cold start)", () => {
    new Player().start(makeMinimalFlow() as any).catch(() => {});
  }, { iterations: 200 });
});

describe("Player data set", () => {
  let state: InProgressState;
  let tick = 0;

  // The real-world hot loop: a bound-data update drives DataController +
  // Resolver + string-resolver to re-resolve the current view.
  bench("set bound data triggers re-resolve", () => {
    tick += 1;
    state.controllers.data.set([["count", tick]]);
  }, {
    setup: () => {
      const player = new Player();
      player.start(makeDataFlow() as any).catch(() => {});
      state = player.getState() as InProgressState;
    },
    iterations: 2000,
  });
});
