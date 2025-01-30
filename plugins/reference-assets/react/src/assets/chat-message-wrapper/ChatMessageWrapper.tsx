import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { TransformedChatMessageWrapperAsset } from "@player-ui/reference-assets-plugin";

export const ChatMessageWrapper = (props: TransformedChatMessageWrapperAsset) => {
  console.log("props.values", props.values);
  debugger;
  return (
    <div className="flex flex-col gap-4">
      {props.values?.map((a) => <ReactAsset key={a.asset.id} {...a} />)}
    </div>
  );
};
