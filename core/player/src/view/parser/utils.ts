import type { Node } from "./types";

/** Check to see if the object contains async */
export function hasAsync(obj: object): boolean {
  return Object.prototype.hasOwnProperty.call(obj, "async");
}

/** Get the ID of the Node if there is one */
export function getNodeID(node?: Node.Node | null): string | undefined {
  if (!node) {
    return;
  }

  if (
    "value" in node &&
    typeof node.value === "object" &&
    typeof node.value?.id === "string"
  ) {
    return node.value.id;
  }
}
