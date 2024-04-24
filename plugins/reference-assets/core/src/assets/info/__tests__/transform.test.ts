import { describe, it, expect } from "vitest";
import { runTransform } from "@player-ui/asset-testing-library";
import { infoTransform } from "..";

describe("info transform", () => {
  it("populates segmentedActions", () => {
    const ref = runTransform("info", infoTransform, {
      id: "generated-flow",
      views: [
        {
          id: "info-view",
          type: "info",
          title: {
            asset: {
              id: "info-title",
              type: "text",
              value: "Info Title",
            },
          },
          actions: [
            {
              asset: {
                id: "next-action",
                value: "Next",
                type: "action",
                label: {
                  asset: {
                    id: "next-action-label",
                    type: "text",
                    value: "Continue",
                  },
                },
              },
            },
            {
              asset: {
                id: "prev-action",
                value: "Prev",
                type: "action",
                label: {
                  asset: {
                    id: "next-action-label",
                    type: "text",
                    value: "Back",
                  },
                },
              },
            },
          ],
        },
      ],
      data: {},
      navigation: {
        BEGIN: "FLOW_1",
        FLOW_1: {
          startState: "VIEW_1",
          VIEW_1: {
            state_type: "VIEW",
            ref: "info-view",
            transitions: {
              "*": "END_Done",
            },
          },
          END_Done: {
            state_type: "END",
            outcome: "done",
          },
        },
      },
    });
    expect(ref.current?.segmentedActions).toStrictEqual({
      next: [
        {
          asset: {
            id: "next-action",
            label: {
              asset: {
                id: "next-action-label",
                type: "text",
                value: "Continue",
              },
            },
            type: "action",
            value: "Next",
          },
        },
      ],
      prev: [
        {
          asset: {
            id: "prev-action",
            label: {
              asset: {
                id: "next-action-label",
                type: "text",
                value: "Back",
              },
            },
            type: "action",
            value: "Prev",
          },
        },
      ],
    });
  });
  it("does not populate segmentedActions", () => {
    const ref = runTransform("info", infoTransform, {
      id: "generated-flow",
      views: [
        {
          id: "info-view",
          type: "info",
          title: {
            asset: {
              id: "info-title",
              type: "text",
              value: "Info Title",
            },
          },
        },
      ],
      data: {},
      navigation: {
        BEGIN: "FLOW_1",
        FLOW_1: {
          startState: "VIEW_1",
          VIEW_1: {
            state_type: "VIEW",
            ref: "info-view",
            transitions: {
              "*": "END_Done",
            },
          },
          END_Done: {
            state_type: "END",
            outcome: "done",
          },
        },
      },
    });
    expect(ref.current?.segmentedActions).toBeUndefined();
  });
});
