import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { AssetWrapper } from "@player-ui/types";

interface AGUITranscriptProps {
  id: string;
  values?: AssetWrapper[];
}

/**
 * Renders the ordered list of transcript bubbles. The session plugin's async-node
 * tap streams a fresh `values` array into this asset on every event, so React
 * picks up new bubbles + in-place text updates through normal prop diffing.
 */
export const AGUITranscript = (props: AGUITranscriptProps) => {
  const { id, values } = props;
  return (
    <div id={id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {values?.map((v, i) => (
        <ReactAsset key={v.asset?.id ?? i} {...v} />
      ))}
    </div>
  );
};
