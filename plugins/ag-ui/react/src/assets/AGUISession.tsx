import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { AssetWrapper } from "@player-ui/types";

interface AGUISessionProps {
  id: string;
  transcript?: AssetWrapper;
  input?: AssetWrapper;
}

/**
 * Top-level layout for an AG-UI session: a vertical stack with the streaming
 * transcript filling the space and a sticky input bar at the bottom. A2UI
 * surfaces arrive as bubbles inside the transcript (no separate sidebar).
 */
export const AGUISession = (props: AGUISessionProps) => {
  const { id, transcript, input } = props;
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
      {input ? (
        <div style={{ padding: 12, borderTop: "1px solid #e5e7eb" }}>
          <ReactAsset {...input} />
        </div>
      ) : null}
    </div>
  );
};
