import { describe, it, expect, beforeEach } from "vitest";
import { createAsyncTransform } from "..";
import { Builder, NodeType, Node } from "@player-ui/player";

describe("createAsyncTransform", () => {
  const asset = Builder.asset({
    id: "2",
    type: "chat-message",
    value: {
      asset: {
        type: "text",
        id: "text-asset",
        value: "text",
      },
    },
  });

  it("should generate a wrapper asset with an async using the id from getAsyncNodeId", async () => {
    const transform = createAsyncTransform({
      transformAssetType: "chat-message",
      wrapperAssetType: "collection",
      flatten: false,
      path: ["array"],
      getAsyncNodeId: () => "async-node",
    });
    const result = transform(asset, {} as any, {} as any);

    expect(result).toStrictEqual({
      type: NodeType.Asset,
      children: [
        {
          path: ["array"],
          value: {
            type: NodeType.MultiNode,
            override: true,
            parent: expect.anything(),
            values: [
              {
                parent: expect.anything(),
                type: NodeType.Async,
                flatten: false,
                onValueReceived: undefined,
                id: "async-node",
                value: {
                  type: NodeType.Value,
                  value: {
                    id: "async-node",
                  },
                },
              },
            ],
          },
        },
      ],
      value: {
        id: "collection-async-node",
        type: "collection",
      },
    });
  });

  it("should asset wrap and insert the nested asset into the generated multi-node", async () => {
    const transform = createAsyncTransform({
      transformAssetType: "chat-message",
      wrapperAssetType: "collection",
      flatten: false,
      path: ["array"],
      getAsyncNodeId: () => "async-node",
      getNestedAsset: () => ({
        type: NodeType.Asset,
        value: {
          id: "nested",
          type: "text",
        },
      }),
    });
    const result = transform(asset, {} as any, {} as any);

    expect(result).toStrictEqual({
      type: NodeType.Asset,
      children: [
        {
          path: ["array"],
          value: {
            type: NodeType.MultiNode,
            override: true,
            parent: expect.anything(),
            values: [
              {
                parent: expect.anything(),
                type: NodeType.Value,
                value: undefined,
                children: [
                  {
                    path: ["asset"],
                    value: {
                      type: NodeType.Asset,
                      value: {
                        type: "text",
                        id: "nested",
                      },
                      parent: expect.anything(),
                    },
                  },
                ],
              },
              {
                parent: expect.anything(),
                type: NodeType.Async,
                flatten: false,
                onValueReceived: undefined,
                id: "async-node",
                value: {
                  type: NodeType.Value,
                  value: {
                    id: "async-node",
                  },
                },
              },
            ],
          },
        },
      ],
      value: {
        id: "collection-async-node",
        type: "collection",
      },
    });
  });

  describe("onValueReceived callback setup", () => {
    let transformedAsset: Node.Node;
    let onValueReceivedFuncion: ((node: Node.Node) => Node.Node) | undefined;

    beforeEach(() => {
      const transform = createAsyncTransform({
        transformAssetType: "chat-message",
        wrapperAssetType: "collection",
        flatten: true,
        path: ["array"],
        getAsyncNodeId: () => "async-node",
      });
      transformedAsset = transform(asset, {} as any, {} as any);
      if ("children" in transformedAsset) {
        const firstChild = transformedAsset.children?.[0]?.value;
        if (firstChild?.type === NodeType.MultiNode) {
          const firstValue = firstChild.values[0];
          if (firstValue?.type === NodeType.Async) {
            onValueReceivedFuncion = firstValue.onValueReceived;
          }
        }
      }
    });

    it("should add an onValueReceived function to the async node that turns if flatten is true", () => {
      expect(transformedAsset).toStrictEqual({
        type: NodeType.Asset,
        children: [
          {
            path: ["array"],
            value: {
              type: NodeType.MultiNode,
              override: true,
              parent: expect.anything(),
              values: [
                {
                  parent: expect.anything(),
                  type: NodeType.Async,
                  flatten: true,
                  onValueReceived: expect.any(Function),
                  id: "async-node",
                  value: {
                    type: NodeType.Value,
                    value: {
                      id: "async-node",
                    },
                  },
                },
              ],
            },
          },
        ],
        value: {
          id: "collection-async-node",
          type: "collection",
        },
      });
      expect(onValueReceivedFuncion).toBeDefined();
    });

    it("should add an onValueReceived function to the async node that turns if flatten is true", () => {
      const result = onValueReceivedFuncion?.(asset);
      expect(result).toStrictEqual({
        override: true,
        parent: expect.anything(),
        type: NodeType.MultiNode,
        values: [
          {
            parent: expect.anything(),
            type: NodeType.Async,
            flatten: true,
            onValueReceived: onValueReceivedFuncion,
            id: "async-node",
            value: {
              type: NodeType.Value,
              value: {
                id: "async-node",
              },
            },
          },
        ],
      });
    });
  });
});
