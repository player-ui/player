import type { Player, PlayerFlowState } from '@player-ui/player';
import { NOT_STARTED_STATE } from '@player-ui/player';
import React from 'react';
import type { ReactPlayerOptions } from './player';
import { ReactPlayer } from './player';
import { StateTapPlugin } from './plugins/tapstate-plugin';

export interface UseReactPlayerReturn {
  /** The web-player instance */
  reactPlayer: ReactPlayer;
  /** Player instance */
  player: Player;
  /** The state of Player */
  playerState: PlayerFlowState;
}

/**
 * The `useReactPlayer` hook is an easy way to integrate the web-player into your React app.
 * Simply supply your config, plugins, and an optional flow, which will be automatically started for you when changed.
 */
export const useReactPlayer = (
  options?: ReactPlayerOptions
): UseReactPlayerReturn => {
  const [playerState, setPlayerState] =
    React.useState<PlayerFlowState>(NOT_STARTED_STATE);

  const reactPlayer = React.useMemo(() => {
    const rp = new ReactPlayer({
      player: options?.player,
      plugins: [
        ...(options?.plugins ?? []),
        new StateTapPlugin(setPlayerState),
      ],
      suspend: options?.suspend,
    });

    return rp;
  }, []);

  const { player } = reactPlayer;

  return {
    reactPlayer,
    player,
    playerState,
  };
};
