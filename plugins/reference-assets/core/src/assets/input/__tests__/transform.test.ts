import { runTransform } from "@player-ui/asset-testing-library";
import { describe, expect, it } from "vitest";
import { Flow } from "@player-ui/player";
import { CommonTypesPlugin } from "@player-ui/common-types-plugin";
import { inputTransform } from "../transform";

describe("Input Asset Transform", () => {
  it("should transform", () => {
    const testFlow: Flow = {
      id: "generated-flow",
      views: [
        {
          id: "input-1",
          type: "input",
          label: {
            asset: {
              id: "input-1-label",
              type: "text",
              value: "Input with validation and formatting",
            },
          },
          note: {
            asset: {
              id: "input-1-note",
              type: "text",
              value: "It expects a positive integer",
            },
          },
          binding: "foo.bar",
        },
      ],
      data: {},
      navigation: {
        BEGIN: "FLOW_1",
        FLOW_1: {
          startState: "VIEW_1",
          VIEW_1: {
            state_type: "VIEW",
            ref: "input-1",
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
      schema: {
        ROOT: {
          foo: {
            type: "FooType",
          },
        },
        FooType: {
          bar: {
            type: "IntegerPosType",
            validation: [
              {
                type: "required",
              },
            ],
          },
        },
      },
    };
    const { current } = runTransform("input", inputTransform, testFlow, [
      new CommonTypesPlugin(),
    ]);
    expect(current?.validation).toBeUndefined();
    expect(current?.dataType?.type).toBe("IntegerPosType");
  });
  it("should transform with validation", () => {
    const testFlow: Flow = {
      id: "generated-flow",
      views: [
        {
          id: "input-1",
          type: "input",
          label: {
            asset: {
              id: "input-1-label",
              type: "text",
              value: "Input with validation and formatting",
            },
          },
          note: {
            asset: {
              id: "input-1-note",
              type: "text",
              value: "It expects a positive integer",
            },
          },
          binding: "foo.bar",
        },
      ],
      data: {},
      navigation: {
        BEGIN: "FLOW_1",
        FLOW_1: {
          startState: "VIEW_1",
          VIEW_1: {
            state_type: "VIEW",
            ref: "input-1",
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
      schema: {
        ROOT: {
          foo: {
            type: "FooType",
          },
        },
        FooType: {
          bar: {
            type: "IntegerPosType",
            validation: [
              {
                type: "required",
                trigger: "load",
              },
            ],
          },
        },
      },
    };
    const { current } = runTransform("input", inputTransform, testFlow, [
      new CommonTypesPlugin(),
    ]);

    expect(current?.validation).not.toBeUndefined();
    expect(current?.dataType?.type).toBe("IntegerPosType");
    expect(current?.validation).toHaveProperty("severity", "error");
    expect(current?.validation).toHaveProperty(
      "message",
      "A value is required",
    );
  });
});
