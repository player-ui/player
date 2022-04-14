import type { Logger } from '@player-ui/player';
import { NoopLogger } from '@player-ui/player';
import { usePlayer } from './player-context';

const noopLogger = new NoopLogger();

/**
 * A hook to get the logger instance from the current player
 */
export function useLogger(): Logger {
  const player = usePlayer();

  return player?.logger ?? noopLogger;
}
