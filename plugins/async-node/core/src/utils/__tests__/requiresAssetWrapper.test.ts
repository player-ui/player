import { NodeType, Node } from "@player-ui/player";
import { describe, expect, it } from "vitest";
import { requiresAssetWrapper } from "../requiresAssetWrapper";

describe("requiresAssetWrapper", () => {
  it("should return true for asset nodes", () => {
    const node: Node.Asset = {
      type: NodeType.Asset,
      value: {
        type: "text",
        id: "id",
      },
    };

    const result = requiresAssetWrapper(node);

    expect(result).toBe(true);
  });

  it("should return true for applicability nodes containing asset nodes", () => {
    const node: Node.Applicability = {
      type: NodeType.Applicability,
      expression: "",
      value: {
        type: NodeType.Asset,
        value: {
          type: "text",
          id: "id",
        },
      },
    };

    const result = requiresAssetWrapper(node);

    expect(result).toBe(true);
  });

  it("should return false for non-asset or non-applicability nodes", () => {
    const node: Node.Value = {
      type: NodeType.Value,
      value: {},
    };

    const result = requiresAssetWrapper(node);

    expect(result).toBe(false);
  });

  it("should return false for applicability nodes that do not contain an asset node", () => {
    const node: Node.Applicability = {
      type: NodeType.Applicability,
      expression: "",
      value: {
        type: NodeType.Value,
        value: {},
      },
    };

    const result = requiresAssetWrapper(node);

    expect(result).toBe(false);
  });
});
