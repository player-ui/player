import { Builder, NodeType, Node } from "@player-ui/player";
import type { AsyncTransformFunc } from "./types";

/**
 * Util function to generate transform function for async asset
 * @param asset - async asset to apply beforeResolve transform
 * @param transformedAssetType: transformed asset type for rendering
 * @param wrapperAssetType: container asset type
 * @param flatten: flatten the streamed in content
 * @param path: property path to add the multinode containing the next async node to
 * @returns - wrapper asset with children of transformed asset and async node
 */

export const asyncTransform: AsyncTransformFunc = (
  assetId,
  wrapperAssetType,
  asset,
  flatten = true,
  path = ["values"],
  me,
) => {
  const id = "async-" + assetId;

  const asyncNode = Builder.asyncNode(
    id,
    flatten,
    ["asset", ...path],
    (node) => {
      if (node.type !== NodeType.Value) {
        return node;
      }

      const child = node.children?.find(
        (x) => x.path.length === 1 && x.path[0] === "asset",
      );

      if (
        child?.value.type !== NodeType.Asset ||
        child.value.value.type !== "chat-message"
      ) {
        return node;
      }

      child.value = me?.(child.value, {} as any, {} as any) ?? child.value;
      return extractNodeFromPath(node, ["asset", ...path]) ?? node;
    },
  );
  let multiNode;
  let assetNode;

  if (asset) {
    assetNode = Builder.assetWrapper(asset);
    multiNode = Builder.multiNode(assetNode, asyncNode);
  } else {
    multiNode = Builder.multiNode(asyncNode);
  }

  const wrapperAsset = Builder.asset({
    id: wrapperAssetType + "-" + id,
    type: wrapperAssetType,
  });

  Builder.addChild(wrapperAsset, path, multiNode);

  return wrapperAsset;
};

/** Follows the given path and returns the node. If there is no match, returns undefined */
const extractNodeFromPath = (
  node: Node.Node,
  path?: string[],
): Node.Node | undefined => {
  if (path === undefined || path.length === 0) {
    return node;
  }

  if (!("children" in node && node.children)) {
    return undefined;
  }

  let matchResult = 0;
  let bestMatch: Node.Child | undefined;
  for (const child of node.children) {
    const matchValue = getMatchValue(child.path, path);
    if (matchValue > matchResult) {
      matchResult = matchValue;
      bestMatch = child;
    }
  }

  if (!bestMatch) {
    return undefined;
  }

  if (matchResult >= path.length) {
    return bestMatch.value;
  }

  return extractNodeFromPath(bestMatch.value, path.slice(matchResult));
};

/** Matches 2 segments where pathA matches or is a subset of pathB. Returns the number of matching segments */
const getMatchValue = (
  pathA: Node.PathSegment[],
  pathB: Node.PathSegment[],
): number => {
  if (pathA.length > pathB.length) {
    return 0;
  }

  let matchCount = 0;
  for (let i = 0; i < pathA.length; i++) {
    if (pathA[i] === pathB[i]) {
      matchCount++;
    } else {
      return matchCount;
    }
  }

  return matchCount;
};
