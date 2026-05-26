import React from "react";
import { ReactAsset } from "@player-ui/react";
import type { AssetWrapper } from "@player-ui/types";

interface AGUISurfaceBubbleProps {
  id: string;
  bubbleId: string;
  surfaceId?: string;
  /** The embedded A2UI asset tree — rendered while `submitted` is false. */
  surface?: AssetWrapper;
  /** Data-bound flag set true by `agui_submitSurface` when the form is submitted. */
  submitted?: boolean | string;
  /** Data-bound text representation of the submitted payload. */
  summary?: string;
}

/**
 * Transcript bubble that hosts an A2UI surface. Before submit it renders the
 * full A2UI tree (form, inputs, button). After submit (`submitted` data-bound
 * flag flips to true), it swaps to a right-aligned user-style bubble showing
 * the text summary of what was submitted — making the surface feel like a
 * natural conversational turn.
 *
 * `submitted` arrives from Player's binding resolution as either a real
 * boolean or the literal binding string when the path hasn't been seeded; we
 * coerce both to a boolean to be safe.
 */
export const AGUISurfaceBubble = (props: AGUISurfaceBubbleProps) => {
  const { id, surface, submitted, summary } = props;
  const isSubmitted = submitted === true || submitted === "true";

  if (isSubmitted) {
    return (
      <div
        id={id}
        style={{
          alignSelf: "flex-end",
          maxWidth: "80%",
          padding: "8px 12px",
          borderRadius: 12,
          background: "#dbeafe",
          whiteSpace: "pre-wrap",
        }}
      >
        {summary ?? ""}
      </div>
    );
  }

  return (
    <div
      id={id}
      style={{
        alignSelf: "stretch",
        padding: 12,
        borderRadius: 12,
        background: "white",
        border: "1px solid #e5e7eb",
      }}
    >
      {surface ? <ReactAsset {...surface} /> : null}
    </div>
  );
};
