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
 * Sticky composer. Tracks local text state for responsiveness, mirrors back to
 * the data model via `setValue`, and fires `agui_send` via the transform's
 * `send()` callback. Disabled while a run is in flight.
 */
export const AGUIInputBar = (props: AGUIInputBarProps) => {
  const { id, value, isRunning, error, setValue, send } = props;
  const [local, setLocal] = React.useState<string>(value ?? "");

  React.useEffect(() => {
    setLocal(value ?? "");
  }, [value]);

  const onSubmit = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setValue(local);
      send();
    },
    [local, send, setValue],
  );

  return (
    <form id={id} onSubmit={onSubmit} style={{ display: "flex", gap: 8 }}>
      <input
        type="text"
        value={local}
        disabled={Boolean(isRunning)}
        placeholder={isRunning ? "Agent is thinking…" : "Message"}
        onChange={(e) => setLocal(e.target.value)}
        style={{
          flex: 1,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid #d1d5db",
        }}
      />
      <button
        type="submit"
        disabled={Boolean(isRunning) || local.length === 0}
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
