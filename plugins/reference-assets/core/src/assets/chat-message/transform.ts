// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck
import type {
  Asset,
  BeforeTransformFunction,
  TransformFunctions,
} from "@player-ui/player";
import { v4 as uuid } from "uuid";
import { Builder } from "@player-ui/player";
import { composeBefore, compose } from "@player-ui/asset-transform-plugin";
import type { ChatMessageAsset } from "./types";

/**
 * In beforeTransform function, pass in flatten marker and call beforeResolve function
 * input: asset
 * @param asset - Asset to apply the transform to
 * @returns - multi-node with async node placeholder
 *
 * example:
 * input:
 * {
  "asset": {
    "id": "some-text",
    "type": "continuous-text"
    "value": "Hello World!"
  }
}
* output:
 chat-message-wrapper {
  id: "chat-message-wrapper",
  type: 
  values:[
      { assetNode },
      { asyncNode }
    ]
  }
 */

export const transform: BeforeTransformFunction<Asset> = (
  asset: ChatMessageAsset,
) => {
  const id = uuid();

  const assetNode = Builder.asset({ ...asset.value, type: "text" });
  const asyncNode = Builder.asyncNode(id);
  const multiNode = Builder.multiNode(assetNode, asyncNode);

  const collectionAsset = Builder.asset({
    id: "chat-message-wrapper",
    type: "chat-message-wrapper",
  });

  Builder.addChild(collectionAsset, ["values"], multiNode);

  return collectionAsset;
};

export const chatMessageTransform: TransformFunctions = compose(
  composeBefore(transform),
);
