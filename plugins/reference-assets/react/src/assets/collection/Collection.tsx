import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { CollectionAsset } from "@player-ui/reference-assets-plugin";

export const Collection = (props: CollectionAsset) => {
  const res: any[] = [];
  console.log("props", props);

  props.values?.forEach((a) => {
    Array.isArray(a?.asset?.values)
      ? a?.asset?.values?.forEach((b) => res.push(b))
      : res.push(a);
  });
  console.log("res", res);

  return (
    <div className="flex flex-col gap-4">
      {props.label && (
        <h3>
          <ReactAsset {...props.label} />
        </h3>
      )}
      {res.length > 0 &&
        res.map((a) => <ReactAsset key={a?.asset?.id} {...a} />)}
    </div>
  );
};
