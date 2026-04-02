import { PlayerError } from "@player-ui/player";
import { ASYNC_ERROR_TYPE, AsyncErrorMetadata } from "../AsyncNodeError";

export const isAsyncPlayerError = (
  error: PlayerError,
): error is PlayerError<AsyncErrorMetadata> => {
  return error.errorType === ASYNC_ERROR_TYPE;
};
