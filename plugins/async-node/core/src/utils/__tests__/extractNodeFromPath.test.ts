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

  const emptyPaths = [undefined, []];
  it.each(emptyPaths)(
    "should return the original node if the path is empty or undefined",
    (path) => {
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

      const result = extractNodeFromPath(node, path);

      expect(result).toStrictEqual(node);
    },
  );

  const noChildrenNodes: Node.Node[] = [
    // No children property
    {
      id: "test",
      type: NodeType.Async,
      value: {
        type: NodeType.Value,
        value: {
          id: "test",
        },
      },
    },
    // Children explicitly set to undefined
    {
      type: NodeType.Value,
      value: {},
      children: undefined,
    },
  ];

  it.each(noChildrenNodes)(
    "should return undefined if there are no children in the node",
    (node) => {
      const result = extractNodeFromPath(node, ["value", "asset"]);
      expect(result).toBeUndefined();
    },
  );

  it("should return undefined if there is no match", () => {
    const node: Node.Value = {
      type: NodeType.Value,
      children: [
        {
          path: ["very", "long", "path"],
          value: {
            type: NodeType.Value,
            value: {},
          },
        },
        {
          path: ["value", "not-asset"],
          value: {
            type: NodeType.Value,
            value: {},
          },
        },
      ],
      value: {},
    };

    const result = extractNodeFromPath(node, ["value", "asset"]);
    expect(result).toBeUndefined();
  });
});
