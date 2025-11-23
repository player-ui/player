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

  // No markdown content: return an empty text asset
  if (children.length === 0) {
    const empty = mappers.text({ originalAsset: asset, value: "" });
    return parser?.(empty, NodeType.Asset) || null;
  }

  // Map all children to their transformed content
  const value = children
    .map((node) => {
      const transformer = transformers[node.type];
      if (!transformer) {
        if (mappers.null) {
          return mappers?.null({ originalAsset: asset });
        } else {
          return null;
        }
      }
      return transformer({
        astNode: node,
        asset,
        mappers,
        transformers,
      });
    })
    .filter((x) => x !== null);

  // If only one item, return it directly; otherwise wrap in collection
  if (value.length === 1) {
    const [first] = value;
    return parser?.(first!, NodeType.Asset) || null;
  }

  const collection = mappers.collection({
    originalAsset: asset,
    value,
  });

  return parser?.(collection, NodeType.Asset) || null;
}
