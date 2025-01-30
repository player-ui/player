import { TransformFunctions, TransformFunction } from "@player-ui/player";
import { compose } from "@player-ui/asset-transform-plugin";
import type {
  ChatMessageWrapperAsset,
  TransformedChatMessageWrapperAsset,
} from "./types";
import type { Asset, AssetWrapper } from "@player-ui/player";

const transform: TransformFunction<
  ChatMessageWrapperAsset,
  TransformedChatMessageWrapperAsset
> = (asset) => {
  const res: any[] = [];
  asset.values?.forEach((a) => unpackAndPush(a, res));
  debugger;
  console.log("res", res);
  console.log("asset", {
    ...asset,
    values: res,
  });

  return {
    ...asset,
    values: res,
  };
};

function unpackAndPush(item: any | any[], initial: any[]) {
  if (Array.isArray(item)) {
    item.forEach((i) => {
      unpackAndPush(i, initial);
    });
  } else {
    initial.push(wrapAsset(item));
  }
}

/**
 * Wrap an Asset in an AssetWrapper
 */
function wrapAsset(asset: Asset): AssetWrapper {
  return {
    asset,
  };
}

export const chatMessageWrapperTransform: TransformFunctions = compose(
  compose(transform),
);
