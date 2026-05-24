import React from "react";

interface AGUITextMessageProps {
  id: string;
  messageId: string;
  role: "user" | "assistant" | "tool" | "system";
  value?: string;
}

const roleStyle: Record<string, React.CSSProperties> = {
  user: { alignSelf: "flex-end", background: "#dbeafe" },
  assistant: { alignSelf: "flex-start", background: "#f3f4f6" },
  tool: { alignSelf: "flex-start", background: "#fef3c7" },
  system: { alignSelf: "center", background: "#e5e7eb", fontStyle: "italic" },
};

export const AGUITextMessage = (props: AGUITextMessageProps) => {
  const { id, role, value } = props;
  return (
    <div
      id={id}
      style={{
        maxWidth: "80%",
        padding: "8px 12px",
        borderRadius: 12,
        whiteSpace: "pre-wrap",
        ...(roleStyle[role] ?? roleStyle.assistant),
      }}
    >
      {value ?? ""}
    </div>
  );
};
