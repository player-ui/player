import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { TransformedImage } from "@player-ui/reference-assets-plugin";

export const Image = (props: TransformedImage) => {
  const { metaData, caption, altText } = props;

  return (
    <figure className="figure">
      <img className="figure-img img-fluid" src={metaData.ref} alt={altText} />
      {caption && (
        <figcaption className="figure-caption" style={{ marginTop: 15 }}>
          <ReactAsset {...caption} />
        </figcaption>
      )}
    </figure>
  );
};
