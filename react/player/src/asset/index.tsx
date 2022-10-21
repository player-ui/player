import React from 'react';
import type { Asset as AssetType, AssetWrapper } from '@player-ui/player';
import type { Registry } from '@player-ui/partial-match-registry';

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
  props: AssetType<string> | AssetWrapper<AssetType<string>>
) => {
  const { registry } = React.useContext(AssetContext);

  let unwrapped;

  if ('type' in props && 'id' in props) {
    unwrapped = props;
  } else if ('asset' in props) {
    unwrapped = (props as unknown as AssetWrapper).asset;
  }

  if (
    !unwrapped ||
    typeof unwrapped !== 'object' ||
    unwrapped?.type === undefined
  ) {
    throw Error(`Cannot determine asset type.`);
  }

  const Impl = registry?.get(unwrapped);

  if (!Impl) {
    throw Error(
      `No implementation found for id: ${unwrapped.id} type: ${unwrapped.type}`
    );
  }

  return <Impl {...unwrapped} />;
};
