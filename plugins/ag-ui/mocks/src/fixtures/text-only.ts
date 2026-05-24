import type { TapeFrame } from "../scripted-agent";

/**
 * One run: a short streamed assistant reply, no tools, no A2UI surfaces.
 */
export const textOnlyTape: TapeFrame[] = [
  { kind: "emit", event: { type: "RUN_STARTED", runId: "run-1" } },
  {
    kind: "emit",
    event: { type: "TEXT_MESSAGE_START", messageId: "m1", role: "assistant" },
  },
  {
    kind: "emit",
    event: { type: "TEXT_MESSAGE_CONTENT", messageId: "m1", delta: "Hello" },
  },
  { kind: "sleep", ms: 30 },
  {
    kind: "emit",
    event: { type: "TEXT_MESSAGE_CONTENT", messageId: "m1", delta: " there" },
  },
  { kind: "sleep", ms: 30 },
  {
    kind: "emit",
    event: { type: "TEXT_MESSAGE_CONTENT", messageId: "m1", delta: "!" },
  },
  { kind: "emit", event: { type: "TEXT_MESSAGE_END", messageId: "m1" } },
  { kind: "emit", event: { type: "RUN_FINISHED" } },
];
