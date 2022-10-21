import React from 'react';
import type { ReactPlayer, ReactPlayerPlugin } from '@player-ui/react';
import { AssetContext } from '@player-ui/react';

export type AssetRegistryEntries = Array<[any, React.ComponentType<any>]>;

/**
 * A streamlined way of registering custom assets with the web-player
 */
export class AssetProviderPlugin implements ReactPlayerPlugin {
  name = 'web-asset-provider-plugin';

  private readonly entries: AssetRegistryEntries;

  /**
   * Create a plugin that will register the given React components as assets to Player
   *
   * @param entries - A list of [match, Component] tuples.
   * If the [match] is an object, it is used as-is.  If it's a `string`, we assume the match represents the 'type' property ({ type: match })
   */
  constructor(entries: AssetRegistryEntries) {
    this.entries = entries;
  }

  applyReact(rp: ReactPlayer) {
    this.entries.forEach(([match, comp]) => {
      const normalizedMatch =
        typeof match === 'string' ? { type: match } : match;

      rp.assetRegistry.set(normalizedMatch, comp);
    });

    // Because some instances may end up with a different copy of the `AssetContext` (depending on bundling and such)
    // We add an entry to use the local version of `@web-player/asset` -- but still utilize the same rp.assetRegistry
    rp.hooks.webComponent.tap(this.name, (Comp) => {
      return () => (
        <AssetContext.Provider value={{ registry: rp.assetRegistry }}>
          <Comp />
        </AssetContext.Provider>
      );
    });
  }
}
