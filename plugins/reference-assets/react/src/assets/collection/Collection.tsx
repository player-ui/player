import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { CollectionAsset } from "@player-ui/reference-assets-plugin";

export const Collection = (props: CollectionAsset) => {
  const res: any[] = [];
  console.log("props", props);

  props.values?.forEach((a) => {
    Array.isArray(a?.asset)
      ? a?.asset?.forEach((b) => res.push(b))
      : res.push(a);
  });
  console.log("res", res);
  console.log(props.values ? props.values[0]?.asset : props.values);

  return (
    <div className="flex flex-col gap-4">
      {props.label && (
        <h3>
          <ReactAsset {...props.label} />
        </h3>
      )}
      {/* {props.values?.map((a) => <ReactAsset key={a.asset.id} {...a} />)} */}

      {/* {props.values?.map((a) => {
        console.log(a);
        if (a.value) {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          return <ReactAsset key={a.value.id} {...a.value} />;
        } else {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          //@ts-ignore
          return <ReactAsset key={a.asset.id} {...a} />;
        }
      })} */}
      {res.length > 0 &&
        res.map((a) => <ReactAsset key={a?.asset?.id} {...a} />)}
    </div>
  );
};
