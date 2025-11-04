import type { Node, ParseObjectOptions } from "@player-ui/player";
import { NodeType } from "@player-ui/player";
import { fromMarkdown } from "mdast-util-from-markdown";
import type { Mappers, MarkdownAsset } from "../types";
import { transformers } from "./transformers";

/**
 * Parses markdown content using a provided mappers record.
 */
export function parseAssetMarkdownContent({
  asset,
  mappers,
  parser,
}: {
  /**
   * Asset to be parsed
   */
  asset: MarkdownAsset;
  /**
   * Mappers record of AST Node to Player Content
   *
   * @see {@link Mappers}
   */
  mappers: Mappers;
  /**
   * Parser object to AST
   */
  parser?: (
    obj: object,
    type?: Node.ChildrenTypes,
    options?: ParseObjectOptions,
  ) => Node.Node | null;
}): Node.Node | null {
  const input = asset.value ?? "";
  const { children } = fromMarkdown(input);

  const createEmptyText = () => {
    const empty = mappers.text({ originalAsset: asset, value: "" });
    return parser?.(empty, NodeType.Asset) || null;
  };

  // No markdown content: return an empty text asset
  if (children.length === 0) {
    return createEmptyText();
  } else if (children.length === 1) {
    const first = children[0];
    const transformer = transformers[first.type];
    const content = transformer({
      astNode: first,
      asset,
      mappers,
      transformers,
    });

    return parser?.(content, NodeType.Asset) || null;
  } else {
    const value = children.map((node) => {
      const transformer = transformers[node.type];
      if (!transformer) {
        return mappers.text({ originalAsset: asset, value: "" });
      }
      return transformer({
        astNode: node,
        asset,
        mappers,
        transformers,
      });
    });

    const collection = mappers.collection({
      originalAsset: asset,
      value,
    });

    return parser?.(collection, NodeType.Asset) || null;
  }
}
