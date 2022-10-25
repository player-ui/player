import React from 'react';
import type { ReactPlayer, ReactPlayerPlugin } from '@player-ui/react';
import type { BeaconArgs } from '@player-ui/beacon-plugin';
import { BeaconPlugin as BeaconCorePlugin } from '@player-ui/beacon-plugin';

export * from '@player-ui/beacon-plugin';

export type BeaconHandler = (options: BeaconArgs) => void;

export interface BeaconContextType {
  /** A callback for when assets beacon data */
  handler: BeaconHandler;
}

export const BeaconContext = React.createContext<BeaconContextType>({
  handler: () => undefined,
});

export type BeaconCallbackArgs = Omit<BeaconArgs, 'view'>;

export type BeaconCallbackFn<T extends Partial<BeaconCallbackArgs>> = (
  options?: T
) => void;

/** A hook for creating a beacon handler */
export function useBeacon<T extends Partial<BeaconCallbackArgs>>(
  initialArgs: T
): BeaconCallbackFn<Omit<BeaconCallbackArgs, keyof T>> {
  const { handler } = React.useContext(BeaconContext);

  return (options?: Omit<BeaconCallbackArgs, keyof T>) => {
    handler({
      ...initialArgs,
      ...(options ?? {}),
    } as BeaconCallbackArgs);
  };
}

/**
 * A plugin for adding beacon support to a web-player
 */
export class BeaconPlugin
  extends BeaconCorePlugin
  implements ReactPlayerPlugin
{
  name = 'beacon-web-plugin';

  applyReact(reactPlayer: ReactPlayer) {
    const handler = this.beacon.bind(this);

    reactPlayer.hooks.webComponent.tap(this.name, (Comp) => () => (
      <BeaconContext.Provider value={{ handler }}>
        <Comp />
      </BeaconContext.Provider>
    ));
  }
}
