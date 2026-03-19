import { PlayerError, Node, ErrorTypes } from "@player-ui/player";
import { AsyncPluginContext } from "../internal-types";
import { isAsyncPlayerError } from "./isAsyncPlayerError";

/** Get the AST Node related to a specific error if avaiable. */
export const getNodeFromError = (
  playerError: PlayerError,
  context: AsyncPluginContext,
): Node.Node | undefined => {
  if (playerError.errorType === ErrorTypes.RENDER) {
    const { assetId } = playerError.metadata ?? {};

    if (typeof assetId !== "string") {
      return undefined;
    }

    return context.assetIdCache.get(assetId);
  }

  if (playerError.errorType === ErrorTypes.VIEW) {
    const { node } = playerError.metadata ?? {};
    // TODO: Remove some of this from here. Maybe export type assertion functions from where the errors are generated?
    if (typeof node === "object" && node !== null && !Array.isArray(node)) {
      return node as Node.Node;
    }
  }

  if (isAsyncPlayerError(playerError)) {
    return playerError.metadata?.node;
  }

  return undefined;
};
