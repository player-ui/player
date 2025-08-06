import type { Node } from "@player-ui/player";

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

/** Follows the given path and returns the node. If there is no match, returns undefined */
export const extractNodeFromPath = (
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
