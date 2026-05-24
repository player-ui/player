import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { AssetWrapper } from "@player-ui/types";

interface AGUISurfaceProps {
  id: string;
  child?: AssetWrapper;
}

/**
 * Container for the latest A2UI surface. Renders its single child — the A2UI
 * asset subtree produced by `embedA2UISnapshot` — and ignores everything else.
 * Replacement happens at the async-node level: a new resolution swaps the
 * resolved subtree in, React re-renders.
 */
export const AGUISurface = (props: AGUISurfaceProps) => {
  const { id, child } = props;
  if (!child) return null;
  return (
    <div id={id}>
      <ReactAsset {...child} />
    </div>
  );
};
