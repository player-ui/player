import React from "react";

interface AGUIReasoningProps {
  id: string;
  value?: string;
}

export const AGUIReasoning = (props: AGUIReasoningProps) => {
  const { id, value } = props;
  const [open, setOpen] = React.useState(false);
  return (
    <div
      id={id}
      style={{
        alignSelf: "flex-start",
        maxWidth: "80%",
        padding: "6px 10px",
        borderRadius: 8,
        background: "#f9fafb",
        border: "1px dashed #d1d5db",
        fontSize: 12,
        color: "#6b7280",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          background: "none",
          border: "none",
          padding: 0,
          color: "#6b7280",
          cursor: "pointer",
        }}
      >
        {open ? "Hide reasoning" : "Show reasoning"}
      </button>
      {open ? (
        <pre
          style={{
            whiteSpace: "pre-wrap",
            margin: "6px 0 0",
            fontFamily: "inherit",
          }}
        >
          {value ?? ""}
        </pre>
      ) : null}
    </div>
  );
};
