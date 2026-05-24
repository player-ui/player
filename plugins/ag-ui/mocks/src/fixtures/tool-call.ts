import type { TapeFrame } from "../scripted-agent";

/**
 * Single run that demonstrates streamed tool-call args + a result.
 */
export const toolCallTape: TapeFrame[] = [
  { kind: "emit", event: { type: "RUN_STARTED", runId: "run-1" } },
  {
    kind: "emit",
    event: {
      type: "TOOL_CALL_START",
      toolCallId: "t1",
      toolCallName: "lookupWeather",
    },
  },
  {
    kind: "emit",
    event: { type: "TOOL_CALL_ARGS", toolCallId: "t1", delta: '{"city":"' },
  },
  {
    kind: "emit",
    event: { type: "TOOL_CALL_ARGS", toolCallId: "t1", delta: 'SF"}' },
  },
  { kind: "emit", event: { type: "TOOL_CALL_END", toolCallId: "t1" } },
  {
    kind: "emit",
    event: {
      type: "TOOL_CALL_RESULT",
      toolCallId: "t1",
      content: { tempF: 64, summary: "Foggy" },
    },
  },
  { kind: "emit", event: { type: "RUN_FINISHED" } },
];
