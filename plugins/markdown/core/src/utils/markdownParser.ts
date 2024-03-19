import type { Node, ParseObjectOptions } from '@player-ui/player';
import { NodeType } from '@player-ui/player';
import type { Asset } from '@player-ui/types';
import { fromMarkdown } from 'mdast-util-from-markdown';
import type { Mappers } from '../types';
import { transformers } from './transformers';

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
  asset: Asset;
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
    options?: ParseObjectOptions
  ) => Node.Node | null;
}): Node.Node | null {
  const { children } = fromMarkdown(asset.value as string);
  const isMultiParagraph = children.length > 1;

  if (isMultiParagraph) {
    const value = children.map((node) => {
      const transformer = transformers[node.type as keyof typeof transformers];
      return transformer({
        astNode: node as any,
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

  const transformer =
    transformers[children[0].type as keyof typeof transformers];
  const content = transformer({
    astNode: children[0] as any,
    asset,
    mappers,
    transformers,
  });

  return parser?.(content, NodeType.Asset) || null;
}
