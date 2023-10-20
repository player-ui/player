import type { TransformFunction } from '@player-ui/player';
import type { ImageAsset, TransformedImage } from './types';

/**
 * Function to retrieve the desired alt text based on passed in props.
 * @param props Image props
 * @returns The alt text for the image asset
 */
const getImageAlt = (props: ImageAsset): string => {
  const { metaData, placeholder, caption } = props;
  if (metaData.accessibility) return metaData.accessibility;

  if (placeholder) return placeholder;

  if (caption) {
    if (typeof caption === 'string') return caption;

    return caption.value;
  }

  return '';
};

/**
 * Sets the Image's placeholder and accessibilty
 */
const transform: TransformFunction<ImageAsset, TransformedImage> = (props) => {
  const { metaData, placeholder, caption } = props;
  const altText = getImageAlt(props);

  let newImage = {
    ...props,
    altText,
  };

  return newImage;
};

export default transform;
