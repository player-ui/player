import { describe, it, beforeEach, vi, expect } from "vitest";
import { BindingParser } from "../../../binding";
import { ExpressionEvaluator } from "../../../expressions";
import { LocalModel, withParser } from "../../../data";
import { SchemaController } from "../../../schema";
import { Resolve, Resolver } from "..";
import type { Node } from "../../parser";
import { NodeType, Parser } from "../../parser";

const simpleViewWithAsync: Node.View = {
  type: NodeType.View,
  children: [
    {
      path: ["value"],
      value: {
        type: NodeType.Async,
        id: "async-node",
        value: {
          type: NodeType.Value,
          value: {
            id: "async-node",
          },
        },
      },
    },
    {
      path: ["value"],
      value: {
        type: NodeType.Value,
        value: {
          id: "value-node",
        },
      },
    },
  ],
  value: {
    type: "view",
    id: "view",
  },
};

describe("Async Node Resolution", () => {
  let resolverOptions: Resolve.ResolverOptions;

  beforeEach(() => {
    const model = new LocalModel({});
    const parser = new Parser();
    const bindingParser = new BindingParser();

    resolverOptions = {
      model,
      parseBinding: bindingParser.parse.bind(bindingParser),
      parseNode: parser.parseObject.bind(parser),
      evaluator: new ExpressionEvaluator({
        model: withParser(model, bindingParser.parse),
      }),
      schema: new SchemaController(),
    };
  });

  it("should", () => {
    const beforeResolveFunction = vi.fn((node: Node.Node | null) => node);

    const resolver = new Resolver(simpleViewWithAsync, resolverOptions);
    resolver.hooks.beforeResolve.tap("test", beforeResolveFunction);

    // Update once to setup cache
    resolver.update();
    // Should call beforeResolve once for each node.
    expect(beforeResolveFunction).toHaveBeenCalledTimes(3);

    // Clear call information before next update.
    beforeResolveFunction.mockClear();

    // Confirm cache by running another update with no changes.
    resolver.update(new Set());
    // Should not need to call before resolve on cached nodes.
    expect(beforeResolveFunction).toHaveBeenCalledTimes(0);

    // Updating with changes marked on "async-node". Should invalidate cache for itself and its parent.
    resolver.update(new Set(), new Set(["async-node"]));
    // Should be called for the async node and the view parent.
    expect(beforeResolveFunction).toHaveBeenCalledTimes(2);
    expect(beforeResolveFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NodeType.View,
        value: {
          type: "view",
          id: "view",
        },
      }),
      expect.anything(),
    );
    expect(beforeResolveFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NodeType.Async,
        id: "async-node",
        value: {
          type: NodeType.Value,
          value: {
            id: "async-node",
          },
        },
      }),
      expect.anything(),
    );
  });

  it("should also", () => {
    const beforeResolveFunction = vi.fn((node: Node.Node | null) => {
      // Add asyncNodesResolved to view to test tracking and invalidation of just the view.
      if (node?.type === NodeType.View) {
        return {
          ...node,
          asyncNodesResolved: ["other-async-id"],
        };
      }

      return node;
    });

    const resolver = new Resolver(simpleViewWithAsync, resolverOptions);
    resolver.hooks.beforeResolve.tap("test", beforeResolveFunction);

    // Update once to setup cache
    resolver.update();
    // Should call beforeResolve once for each node.
    expect(beforeResolveFunction).toHaveBeenCalledTimes(3);

    // Clear call information before next update.
    beforeResolveFunction.mockClear();

    // Confirm cache by running another update with no changes.
    resolver.update(new Set());
    // Should not need to call before resolve on cached nodes.
    expect(beforeResolveFunction).toHaveBeenCalledTimes(0);

    // Updating with changes marked on "async-node". Should invalidate cache for itself and its parent.
    resolver.update(new Set(), new Set(["other-async-id"]));
    // Should be called just for the view.
    expect(beforeResolveFunction).toHaveBeenCalledOnce();
    expect(beforeResolveFunction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: NodeType.View,
        value: {
          type: "view",
          id: "view",
        },
      }),
      expect.anything(),
    );
  });
});
