import type {
  BeforeTransformFunction,
  TransformFunctions,
} from "@player-ui/player";
import { composeBefore, compose } from "@player-ui/asset-transform-plugin";
import type { ChatMessageAsset } from "./types";
import { asyncTransform } from "@player-ui/async-node-plugin";
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

export const transform: BeforeTransformFunction<ChatMessageAsset> = (asset) => {
  return asyncTransform(asset, "text", "collection");
};

export const chatMessageTransform: TransformFunctions = compose(
  composeBefore(transform),
);
