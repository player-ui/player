import type { TransformFunction } from "@player-ui/player";
import type { ImageAsset, TransformedImage } from "./types";

/**
 * Function to retrieve the desired alt text based on passed in props.
 * @param props Image props
 * @returns The alt text for the image asset
 */
const getImageAlt = (props: ImageAsset): string => {
  const { metaData, placeholder } = props;
  if (metaData.accessibility) return metaData.accessibility;

  if (placeholder) return placeholder;

  return "Image";
};

/**
 * Sets the Image's placeholder and accessibilty
 */
export const imageTransform: TransformFunction<ImageAsset, TransformedImage> = (
  props,
) => {
  const altText = getImageAlt(props);

  const newImage = {
    ...props,
    altText,
  };

  return newImage;
};
