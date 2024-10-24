import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { TransformedImage } from "@player-ui/reference-assets-plugin";

export const Image = (props: TransformedImage) => {
  const { metaData, caption, altText } = props;

  return (
    <figure className="player-figure">
      <img
        className="player-figure-img player-img-fluid"
        src={metaData.ref}
        alt={altText}
      />
      {caption && (
        <figcaption className="player-figure-caption" style={{ marginTop: 15 }}>
          <ReactAsset {...caption} />
        </figcaption>
      )}
    </figure>
  );
};
