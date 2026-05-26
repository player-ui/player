import type { AGUIMessage } from "@player-ui/ag-ui-plugin";
import type { TapeFrame } from "../scripted-agent";

/**
 * Per-run factory that mints a fresh `messageId` so successive runs don't
 * collide on the same id (AG-UI message ids are spec'd as globally unique).
 *
 * Run N >= 1 echoes the most recent user message — if the user typed "Hi",
 * the reply is "I see you said 'Hi'!"; otherwise a friendly default.
 */
export function textOnlyTapeFor(
  runIndex: number,
  messages: AGUIMessage[],
): TapeFrame[] {
  const mid = `m-${runIndex}-1`;
  const runId = `run-${runIndex}`;
  const lastUser = [...messages]
    .reverse()
    .find((m) => m.role === "user")?.content;
  const reply =
    runIndex === 0
      ? "Hello there!"
      : lastUser
        ? `I see you said "${lastUser}". Want to say more?`
        : "What's on your mind?";
  return [
    { kind: "emit", event: { type: "RUN_STARTED", runId } },
    {
      kind: "emit",
      event: { type: "TEXT_MESSAGE_START", messageId: mid, role: "assistant" },
    },
    ...streamWord(mid, reply),
    { kind: "emit", event: { type: "TEXT_MESSAGE_END", messageId: mid } },
    { kind: "emit", event: { type: "RUN_FINISHED" } },
    { kind: "wait" },
  ];
}

function streamWord(messageId: string, text: string): TapeFrame[] {
  // Split into ~3-char chunks so streaming is visible without dragging out
  // the story; one short sleep between chunks.
  const frames: TapeFrame[] = [];
  for (let i = 0; i < text.length; i += 3) {
    frames.push({
      kind: "emit",
      event: {
        type: "TEXT_MESSAGE_CONTENT",
        messageId,
        delta: text.slice(i, i + 3),
      },
    });
    frames.push({ kind: "sleep", ms: 20 });
  }
  return frames;
}
