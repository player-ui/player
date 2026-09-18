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
  // `asset.value` is typed as `string | undefined`, but it's ultimately
  // populated by expression/binding resolution at runtime, which can hand
  // back a non-string, non-nullish value (e.g. a number, or an object) if a
  // template can't be fully resolved. `?? ""` only substitutes for
  // null/undefined, so a non-string survives unchanged straight into
  // `fromMarkdown`. mdast-util-from-markdown's preprocessor only handles a
  // string or a Buffer (decoding the latter via `TextDecoder`); anything
  // else falls into the Buffer branch and throws `TextDecoder is not
  // defined` in any environment where that global isn't available (e.g.
  // J2V8). Coerce explicitly so `input` is always a real string.
  const rawValue = asset.value;
  const input =
    rawValue === undefined || rawValue === null ? "" : String(rawValue);
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
