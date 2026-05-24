import type { Asset } from "@player-ui/types";
import type { Logger } from "@player-ui/player";
import { adaptA2UIToFlow, type A2UISnapshot } from "@player-ui/a2ui-plugin";

/**
 * Convert an A2UI snapshot to the Asset subtree that should occupy AG-UI's
 * `surface` slot. We reuse the existing `adaptA2UIToFlow` adapter (so any A2UI
 * snapshot the platform supports works inside AG-UI) and then extract the view
 * root asset — we want the subtree to splice in, not a sibling flow.
 *
 * The `agui_surface_<surfaceId>` wrapper preserves the surface id for diagnostics
 * without altering the A2UI tree structure.
 */
export function embedA2UISnapshot(
  snapshot: A2UISnapshot,
  logger?: Logger,
): Asset {
  const flow = adaptA2UIToFlow(snapshot, logger);
  const view = flow.views?.[0];
  if (!view) {
    throw new Error(
      "[ag-ui] adaptA2UIToFlow produced no view for the supplied A2UI snapshot",
    );
  }
  return view as Asset;
}
