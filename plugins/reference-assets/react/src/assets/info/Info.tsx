import React from "react";
import type { InfoAssetTransform } from "@player-ui/reference-assets-plugin";
import { ReactAsset } from "@player-ui/react";
import { Separator } from "../../components/Separator";

/** The info view type is used to show information to the user */
export const Info = (props: InfoAssetTransform) => {
  return (
    <div className="player-max-w-full">
      <div className="player-flex player-flex-col player-gap-4">
        {props.title && (
          <h1 className="player-scroll-m-20 player-text-4xl player-font-extrabold player-tracking-tight lg:player-text-5xl">
            <ReactAsset {...props.title} />
          </h1>
        )}
        {props.subTitle && (
          <h3 className="player-scroll-m-20 player-text-2xl player-font-semibold player-tracking-tight">
            <ReactAsset {...props.subTitle} />
          </h3>
        )}
        {props.primaryInfo && (
          <div>
            <ReactAsset {...props.primaryInfo} />
          </div>
        )}
        <div className="player-flex player-flex-col player-gap-4">
          {props?.segmentedActions && <Separator />}
          <div className="player-flex player-justify-between sm:player-flex-row player-flex-col-reverse player-gap-4">
            <div className="player-flex player-gap-4">
              {props?.segmentedActions?.prev?.map((a) => (
                <ReactAsset key={a.asset.id} {...a} />
              ))}
            </div>
            <div className="player-flex player-gap-4">
              {props?.segmentedActions?.next?.map((a) => (
                <ReactAsset key={a.asset.id} {...a} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
