import React from "react";
import type { Player, NavigationFlowViewState } from "@player-ui/player";

export interface PlayerContextType {
  /**
   * An instance of a headless player
   */
  player?: Player;

  /** The currently rendered view state */
  viewState?: NavigationFlowViewState;
}

export const PlayerContext = React.createContext<PlayerContextType>({});

/**
 * A hook to get the current player
 */
export const usePlayer = () => {
  const { player } = React.useContext(PlayerContext);

  return player;
};
