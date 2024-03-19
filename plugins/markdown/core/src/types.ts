import type { Asset } from '@player-ui/types';

export interface BaseArgs {
  /**
   * Unparsed Asset
   */
  originalAsset: Asset;
}

export type LiteralMapper<T extends object = object> = (
  args: {
    /**
     * markdown element value
     */
    value: string;
  } & BaseArgs &
    T
) => Asset;

export type CompositeMapper<T extends object = object> = (
  args: {
    /**
     * array of assets resulted from the recursion over the AST node children
     */
    value: Asset[];
  } & BaseArgs &
    T
) => Asset;

export type FallbackMapper = (
  args: {
    /**
     * markdown element value
     */
    value: string | Asset[];
  } & BaseArgs
) => Asset;

export interface Mappers {
  /**
   * required text Asset
   */
  text: LiteralMapper;
  /**
   * required paragraph (composite) Asset
   */
  paragraph: CompositeMapper;
  /**
   * required collection Asset to wrap arrays of assets
   */
  collection: CompositeMapper;
  /**
   * strong markdown (e.g. **bold**)
   */
  strong?: CompositeMapper;
  /**
   * emphasis markdown (e.g. *italic*)
   */
  emphasis?: CompositeMapper;
  /**
   * blockquote markdown (e.g. > blockquote)
   */
  blockquote?: CompositeMapper;
  /**
   * ordered or unordered list markdown (e.g. 1. item\n2. item, - item\n- item)
   */
  list?: CompositeMapper<{
    /**
     * Whether the list is ordered or not.
     */
    ordered: boolean;
    /**
     * The starting list number.
     */
    start?: number;
  }>;
  /**
   * horizontalRule markdown (e.g. ---)
   */
  horizontalRule?: LiteralMapper;
  /**
   * link markdown (e.g. `[text](url)`)
   */
  link?: CompositeMapper<{
    /**
     * Link URL
     */
    href: string;
  }>;
  /**
   * image markdown (e.g. `![alt](url)`)
   */
  image?: LiteralMapper<{
    /**
     * Image source URL
     */
    src: string;
  }>;
  /**
   * code block markdown (e.g. ```code```)
   */
  code?: LiteralMapper<{
    /**
     * The language of the code block.
     */
    lang?: string;
  }>;
  /**
   * heading markdown (e.g. # heading)
   */
  heading?: CompositeMapper<{
    /**
     * The heading depth.
     */
    depth: number;
  }>;
  /**
   * inline code markdown (e.g. `code`)
   */
  inlineCode?: LiteralMapper;
  /**
   * list item markdown (e.g. - item)
   */
  listItem?: CompositeMapper;
}

export type Transformer<T = any> = (args: {
  /**
   * AST Node (e.g. Link)
   */
  astNode: T;
  /**
   * Player Asset
   */
  asset: Asset;
  /**
   * Record off mappers (markdown element -> Asset)
   */
  mappers: Mappers;
  /**
   * Record of parsers (e.g., { link :linkParser })
   */
  transformers: Record<string, Transformer>;
}) => Asset;
