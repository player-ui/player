import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { CollectionAsset } from "@player-ui/reference-assets-plugin";

export const Collection = (props: CollectionAsset) => {
  return (
    <div className="player-flex player-flex-col player-gap-4">
      {props.label && (
        <h3>
          <ReactAsset {...props.label} />
        </h3>
      )}
      {props.values?.map((a) => <ReactAsset key={a.asset.id} {...a} />)}
    </div>
  );
};
