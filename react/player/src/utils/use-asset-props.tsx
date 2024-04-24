import type { Asset } from "@player-ui/player";

/** Common props for any dom node */
export function useAssetProps(asset: Asset) {
  return {
    id: asset.id,
    "data-asset-type": asset.type,
  };
}
