import { NodeType, Node } from "@player-ui/player";
import { describe, expect, it } from "vitest";
import { extractNodeFromPath } from "../extractNodeFromPath";

describe("extractNodeFromPath", () => {
  it("should return any child with an exact match", () => {
    const node: Node.Value = {
      type: NodeType.Value,
      value: {},
      children: [
        {
          path: ["value", "asset"],
          value: {
            type: NodeType.Asset,
            value: {
              id: "id-1",
              type: "type-1",
            },
          },
        },
        {
          path: ["value"],
          value: {
            type: NodeType.Value,
            value: {},
            children: [
              {
                path: ["asset"],
                value: {
                  type: NodeType.Asset,
                  value: {
                    id: "id-2",
                    type: "type-2",
                  },
                },
              },
            ],
          },
        },
      ],
    };

    const result = extractNodeFromPath(node, ["value", "asset"]);

    expect(result).toStrictEqual({
      type: NodeType.Asset,
      value: {
        id: "id-1",
        type: "type-1",
      },
    });
  });

  it("should follow partial matches to find the path nested", () => {
    const node: Node.Value = {
      type: NodeType.Value,
      value: {},
      children: [
        {
          path: ["value"],
          value: {
            type: NodeType.Value,
            value: {},
            children: [
              {
                path: ["asset"],
                value: {
                  type: NodeType.Asset,
                  value: {
                    id: "id-2",
                    type: "type-2",
                  },
                },
              },
            ],
          },
        },
      ],
    };

    const result = extractNodeFromPath(node, ["value", "asset"]);

    expect(result).toStrictEqual({
      type: NodeType.Asset,
      value: {
        id: "id-2",
        type: "type-2",
      },
    });
  });
});
