import React from "react";

interface AGUIInputBarProps {
  id: string;
  value?: string;
  isRunning?: boolean;
  error?: string;
  setValue(next: string): void;
  send(): void;
}

/**
 * Sticky composer. The input is bound directly to the model via `setValue`
 * (the platform-agnostic transform), so when `agui_send` clears the model
 * after submit the input goes empty on its own — no React-local state needed.
 * Disabled while a run is in flight.
 */
export const AGUIInputBar = (props: AGUIInputBarProps) => {
  const { id, value, isRunning, error, setValue, send } = props;
  const current = value ?? "";

  const onSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (current.length === 0) return;
      send();
    },
    [current, send],
  );

  return (
    <form id={id} onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
      <input
        type="text"
        value={current}
        disabled={Boolean(isRunning)}
        placeholder={isRunning ? "Agent is thinking…" : "Message"}
        onChange={(e) => setValue(e.target.value)}
        style={{
          flex: 1,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
        }}
      />
      <button
        type="submit"
        disabled={Boolean(isRunning) || current.length === 0}
        style={{
          padding: "8px 16px",
          borderRadius: 8,
          border: "none",
          background: "#2563eb",
          color: "white",
          cursor: "pointer",
        }}
      >
        Send
      </button>
      {error ? (
        <div role="alert" style={{ color: "#b91c1c", fontSize: 12 }}>
          {error}
        </div>
      ) : null}
    </form>
  );
};
