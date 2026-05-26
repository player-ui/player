import React from "react";

interface AGUIToolCallProps {
  id: string;
  toolCallId: string;
  toolCallName: string;
  args?: string;
  result?: unknown;
}

export const AGUIToolCall = (props: AGUIToolCallProps) => {
  const { id, toolCallName, args, result } = props;
  return (
    <div
      id={id}
      style={{
        alignSelf: "flex-start",
        maxWidth: "80%",
        padding: "8px 12px",
        borderRadius: 8,
        background: "#ecfdf5",
        border: "1px solid #a7f3d0",
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{toolCallName}</div>
      {args ? (
        <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontSize: 12 }}>
          {args}
        </pre>
      ) : null}
      {result !== undefined && result !== null ? (
        <div style={{ marginTop: 6, fontSize: 12 }}>
          <strong>result: </strong>
          {typeof result === "string" ? result : JSON.stringify(result)}
        </div>
      ) : null}
    </div>
  );
};
