import type { Node } from '@player-ui/player';

export type AsyncNodeHandler = (
  node: Node.Node,
  update: (object: Object) => void
) => void;
