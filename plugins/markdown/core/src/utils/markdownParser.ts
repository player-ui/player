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
  if (!children || children.length === 0) {
    const empty = mappers.text({ originalAsset: asset, value: "" });
    return parser?.(empty, NodeType.Asset) || null;
  }

  const isMultiParagraph = children.length > 1;

  if (isMultiParagraph) {
    const value = children.map((node) => {
      const transformer = transformers[node.type as keyof typeof transformers];
      if (!transformer) {
        return mappers.text({ originalAsset: asset, value: "" });
      }
      return transformer({
        astNode: node as unknown,
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

  const first = children[0];
  if (!first) {
    const empty = mappers.text({ originalAsset: asset, value: "" });
    return parser?.(empty, NodeType.Asset) || null;
  }

  const transformer = transformers[first.type as keyof typeof transformers];
  if (!transformer) {
    const empty = mappers.text({ originalAsset: asset, value: "" });
    return parser?.(empty, NodeType.Asset) || null;
  }

  const content = transformer({
    astNode: first as unknown,
    asset,
    mappers,
    transformers,
  });

  return parser?.(content, NodeType.Asset) || null;
}
