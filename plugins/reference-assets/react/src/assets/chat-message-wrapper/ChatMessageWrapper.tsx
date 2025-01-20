import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { ChatMessageWrapperAsset } from "@player-ui/reference-assets-plugin";

export const ChatMessageWrapper = (props: ChatMessageWrapperAsset) => {
  const res: any[] = [];

  props.values?.forEach((a) => unpackAndPush(a, res));

  return (
    <div className="flex flex-col gap-4">
      {res.length > 0 &&
        res.map((a) => <ReactAsset key={a?.asset?.id} {...a} />)}
    </div>
  );
};

function unpackAndPush(item: any | any[], initial: any[]) {
  if (Array.isArray(item)) {
    item.forEach((i) => {
      unpackAndPush(i, initial);
    });
  } else {
    initial.push(item);
  }
}
