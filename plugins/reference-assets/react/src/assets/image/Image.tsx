import React from 'react';
import type { ImageAsset } from '@player-ui/reference-assets-plugin';

export const Image = (props: ImageAsset) => {
  return (
    <Image
      source={{
        uri: props.metaData.ref,
      }}
    />
  );
};
