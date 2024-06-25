import React from "react";
import type { InfoAssetTransform } from "@player-ui/reference-assets-plugin";
import { ReactAsset } from "@player-ui/react";
import { Separator } from "../../components/Separator";

/** The info view type is used to show information to the user */
export const Info = (props: InfoAssetTransform) => {
  return (
    <div className="max-w-full">
      <div className="flex flex-col gap-4">
        {props.title && (
          <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
            <ReactAsset {...props.title} />
          </h1>
        )}
        {props.subTitle && (
          <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
            <ReactAsset {...props.subTitle} />
          </h3>
        )}
        {props.primaryInfo && (
          <div>
            <ReactAsset {...props.primaryInfo} />
          </div>
        )}
        <div className="flex flex-col gap-4">
          {props?.segmentedActions && <Separator />}
          <div className="flex justify-between sm:flex-row flex-col-reverse gap-4">
            <div className="flex gap-4">
              {props?.segmentedActions?.prev?.map((a) => (
                <ReactAsset key={a.asset.id} {...a} />
              ))}
            </div>
            <div className="flex gap-4">
              {props?.segmentedActions?.next?.map((a) => (
                <ReactAsset key={a.asset.id} {...a} />
              ))}
            </div>
            <div>
              {props.footer && (
                <ReactAsset {...props.footer} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
