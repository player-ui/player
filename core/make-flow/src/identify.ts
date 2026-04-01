import type { AssetWrapper } from "@player-ui/types";

export enum ObjType {
  FLOW,
  ASSET,
  ASSET_WRAPPER,
  UNKNOWN,
}

/** Try to identify any object as an Asset or Flow  */
export function identify(obj: object): ObjType {
  if ("id" in obj && "type" in obj) {
    return ObjType.ASSET;
  }

  if (
    "asset" in obj &&
    identify((obj as AssetWrapper).asset) === ObjType.ASSET
  ) {
    return ObjType.ASSET_WRAPPER;
  }

  if ("navigation" in obj || "schema" in obj || "views" in obj) {
    return ObjType.FLOW;
  }

  return ObjType.UNKNOWN;
}
