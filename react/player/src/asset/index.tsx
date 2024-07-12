import React from "react";
import type { Asset as AssetType, AssetWrapper } from "@player-ui/player";
import type { Registry } from "@player-ui/partial-match-registry";

export type AssetRegistryType = Registry<React.ComponentType<any>>;

export interface ContextType {
  /**
   * A registry of Asset -> React Components
   */
  registry?: AssetRegistryType;
}

export const AssetContext = React.createContext<ContextType>({});

/**
 * A React Component that looks up an implementation from a registry
 */
export const ReactAsset = (
  props: AssetType<string> | AssetWrapper<AssetType<string>>,
) => {
  const { registry } = React.useContext(AssetContext);

  let unwrapped;

  if ("type" in props && "id" in props) {
    unwrapped = props;
  } else if ("asset" in props) {
    unwrapped = (props as unknown as AssetWrapper).asset;
  }

  if (!unwrapped) {
    throw Error(
      `Cannot determine asset type for props: ${JSON.stringify(props)}`,
    );
  }

  if (typeof unwrapped !== "object") {
    throw Error(
      `Asset was not an object got (${typeof unwrapped}) instead: ${unwrapped}`,
    );
  }

  if (unwrapped.type === undefined) {
    const info =
      unwrapped.id === undefined
        ? JSON.stringify(props)
        : `id: ${unwrapped.id}`;
    throw Error(`Asset is missing type for ${info}`);
  }

  if (!registry || registry.isRegistryEmpty()) {
    throw Error(`No asset found in registry. This could happen for one of the following reasons: \n
      1. You might have no assets registered or no plugins added to the Player instance. \n
      2. You might have mismatching versions of React Asset Registry Context. \n
      See https://player-ui.github.io/latest/tools/cli#player-dependency-versions-check for tips about how to debug and fix this problem`);
  }

  const Impl = registry?.get(unwrapped);

  if (!Impl) {
    const matchList: object[] = [];

    registry.forEach((asset) => {
      matchList.push(asset.key);
    });

    throw Error(
      `No implementation found for id: ${unwrapped.id} type: ${unwrapped.type}. \n 
      Registered Asset matching functions are listed below: \n
      ${JSON.stringify(matchList)}`,
    );
  }

  return <Impl key={unwrapped.id} {...unwrapped} />;
};
