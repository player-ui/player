import React from "react";
import type { Query } from "@player-ui/check-path-plugin";
import type { Asset } from "@player-ui/react";
import { CheckPathContext } from "./context";

export type AssetOrID = Asset | string;

/** get the id for an asset */
function getId(asset: AssetOrID): string {
  return typeof asset === "string" ? asset : asset.id;
}

/** hook to check if the asset has the given parents */
export function useHasParentContext(
  asset: AssetOrID | undefined,
  query: Query | Query[],
): boolean {
  const { plugin } = React.useContext(CheckPathContext);

  if (!plugin || !asset) {
    return false;
  }

  return plugin.hasParentContext(getId(asset), query);
}

/** hook to check if the asset has the given children */
export function useHasChildContext(
  asset: AssetOrID | undefined,
  query: Query | Query[],
): boolean {
  const { plugin } = React.useContext(CheckPathContext);

  if (!plugin || !asset) {
    return false;
  }

  return plugin.hasChildContext(getId(asset), query);
}

/** hook to get the prop of the given asset on the parent */
export function useGetParentProp(
  asset: AssetOrID | undefined,
): string | number | undefined {
  const { plugin } = React.useContext(CheckPathContext);

  if (!plugin || !asset) {
    return undefined;
  }

  return plugin.getParentProp(getId(asset));
}

/** hook to get the path of the asset in the view */
export function useGetPath(
  asset: AssetOrID | undefined,
  query?: Query | Query[],
): Array<string | number> | undefined {
  const { plugin } = React.useContext(CheckPathContext);

  if (!plugin || !asset) {
    return undefined;
  }

  return plugin.getPath(getId(asset), query);
}

/** get the parent of the given asset */
export function useGetParent<T extends Asset>(
  asset: AssetOrID | undefined,
  query?: Query | Query[],
): T | undefined {
  const { plugin } = React.useContext(CheckPathContext);

  if (!plugin || !asset) {
    return undefined;
  }

  return plugin.getParent(getId(asset), query) as T | undefined;
}
