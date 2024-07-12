import { usePlayer } from "./player-context";

/** Hook to get a constant under a specific namespace */
export function useGetConstantByType(type: string, key: string): unknown {
  const player = usePlayer();

  return player?.constantsController.getConstants(key, type);
}

/** Get a constant under the default namespace */
export function useGetConstant(key: string): unknown {
  const player = usePlayer();

  return player?.constantsController.getConstants(key, "constants");
}
