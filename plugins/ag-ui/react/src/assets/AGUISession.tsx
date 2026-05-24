import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { AssetWrapper } from "@player-ui/types";

interface AGUISessionProps {
  id: string;
  transcript?: AssetWrapper;
  surface?: AssetWrapper;
  input?: AssetWrapper;
}

/**
 * Top-level layout for an AG-UI session: a vertical stack with the streaming
 * transcript on top, an embedded A2UI surface region below it, and a sticky
 * input bar at the bottom.
 */
export const AGUISession = (props: AGUISessionProps) => {
  const { id, transcript, surface, input } = props;
  return (
    <div
      id={id}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
        {transcript ? <ReactAsset {...transcript} /> : null}
      </div>
      {surface ? (
        <div style={{ padding: 12, borderTop: "1px solid #e5e7eb" }}>
          <ReactAsset {...surface} />
        </div>
      ) : null}
      {input ? (
        <div style={{ padding: 12, borderTop: "1px solid #e5e7eb" }}>
          <ReactAsset {...input} />
        </div>
      ) : null}
    </div>
  );
};
