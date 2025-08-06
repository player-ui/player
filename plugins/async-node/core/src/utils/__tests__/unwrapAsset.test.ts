import { NodeType, Node } from "@player-ui/player";
import { describe, expect, it } from "vitest";
import { unwrapAsset } from "../unwrapAsset";

describe("unwrapAsseet", () => {
  it("should return the original node if the current node is not a value node", () => {
    const node: Node.MultiNode = {
      type: NodeType.MultiNode,
      values: [],
    };

    const result = unwrapAsset(node);
    expect(result).toStrictEqual({
      type: NodeType.MultiNode,
      values: [],
    });
  });

  const noAssetChildren = [undefined, []];
  it.each(noAssetChildren)(
    "should return the original node if it can't unwrap the asset",
    (children) => {
      const node: Node.Value = {
        type: NodeType.Value,
        value: {},
        children,
      };

      const result = unwrapAsset(node);
      expect(result).toStrictEqual({
        type: NodeType.Value,
        value: {},
        children,
      });
    },
  );

  it("should unwrap and return the asset from a value node", () => {
    const node: Node.Value = {
      type: NodeType.Value,
      value: {},
      children: [
        {
          path: ["asset"],
          value: {
            type: NodeType.Asset,
            value: {
              id: "id",
              type: "type",
            },
          },
        },
      ],
    };

    const result = unwrapAsset(node);
    expect(result).toStrictEqual({
      type: NodeType.Asset,
      value: {
        id: "id",
        type: "type",
      },
    });
  });
});
