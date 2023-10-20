import React from 'react';
import { ReactAsset } from '@player-ui/react';
import type { TransformedImage } from '@player-ui/reference-assets-plugin';

export const Image = (props: TransformedImage) => {
  const { metaData, caption, altText } = props;
  return (
    <figure>
      <img src={metaData.ref} alt={altText} />
      {caption && (
        <figcaption>
          <ReactAsset {...caption} />
        </figcaption>
      )}
    </figure>
  );
};
