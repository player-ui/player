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

  const Impl = registry?.get(unwrapped);

  if (!Impl) {
    throw Error(
      `No implementation found for id: ${unwrapped.id} type: ${unwrapped.type}`,
    );
  }

  return <Impl key={unwrapped.id} {...unwrapped} />;
};
