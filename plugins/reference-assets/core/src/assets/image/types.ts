import type { Asset, AssetWrapper } from "@player-ui/player";

export interface ImageAsset extends Asset<"image"> {
  /** Reference to the image */
  metaData: ImageMetaData;

  /** Optional placeholder text */
  placeholder?: string;

  /** Optional caption */
  caption?: AssetWrapper;
}

/** A modifier to turn the text into a link */
export interface ImageMetaData {
  /** The location of the image to load */
  ref: string;

  /** Used for accessibility support */
  accessibility?: string;
}

export interface TransformedImage extends ImageAsset {
  /** Alt text */
  altText: string;
}
