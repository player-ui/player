import { PlayerError, Node, ErrorTypes } from "@player-ui/player";
import { AsyncPluginContext } from "../internal-types";
import { isAsyncPlayerError } from "./isAsyncPlayerError";

/** Get the AST Node related to a specific error if available. */
export const getNodeFromError = (
  playerError: PlayerError,
  context: AsyncPluginContext,
): Node.Node | undefined => {
  if (playerError.type === ErrorTypes.RENDER) {
    const { assetId } = playerError.metadata ?? {};

    if (typeof assetId !== "string") {
      return undefined;
    }

    return context.assetIdCache.get(assetId);
  }

  if (playerError.type === ErrorTypes.VIEW) {
    const { node } = playerError.metadata ?? {};
    // TODO: Remove some of this from here. Maybe export type assertion functions from where the errors are generated?
    if (typeof node === "object" && node !== null && !Array.isArray(node)) {
      return node as Node.Node;
    }
  }

  if (isAsyncPlayerError(playerError) && playerError.metadata !== undefined) {
    // Use the node from the cache to ensure it is the latest version of the async node from the resolver
    return context.asyncNodeCache.get(playerError.metadata.node.id)?.asyncNode;
  }

  return undefined;
};
