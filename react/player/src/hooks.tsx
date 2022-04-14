import type { Player, PlayerFlowState } from '@player-ui/player';
import { NOT_STARTED_STATE } from '@player-ui/player';
import React from 'react';
import type { WebPlayerOptions } from './player';
import { WebPlayer } from './player';
import { StateTapPlugin } from './plugins/tapstate-plugin';

export interface UseWebPlayerReturn {
  /** The web-player instance */
  webPlayer: WebPlayer;
  /** Player instance */
  player: Player;
  /** The state of Player */
  playerState: PlayerFlowState;
}

/**
 * The `useWebPlayer` hook is an easy way to integrate the web-player into your React app.
 * Simply supply your config, plugins, and an optional flow, which will be automatically started for you when changed.
 */
export const useWebPlayer = (
  options?: WebPlayerOptions
): UseWebPlayerReturn => {
  const [playerState, setPlayerState] =
    React.useState<PlayerFlowState>(NOT_STARTED_STATE);

  const webPlayer = React.useMemo(() => {
    const wp = new WebPlayer({
      player: options?.player,
      plugins: [
        ...(options?.plugins ?? []),
        new StateTapPlugin(setPlayerState),
      ],
      suspend: options?.suspend,
    });

    return wp;
  }, []);

  const { player } = webPlayer;

  return {
    webPlayer,
    player,
    playerState,
  };
};
