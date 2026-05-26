import type { TapeFrame } from "../scripted-agent";

/**
 * Per-run factory. Each run streams a fresh tool-call (unique `toolCallId`)
 * so successive runs accumulate in the transcript instead of overwriting.
 */
export function toolCallTapeFor(runIndex: number): TapeFrame[] {
  const tid = `t-${runIndex}-1`;
  const runId = `run-${runIndex}`;
  return [
    { kind: "emit", event: { type: "RUN_STARTED", runId } },
    {
      kind: "emit",
      event: {
        type: "TOOL_CALL_START",
        toolCallId: tid,
        toolCallName: "lookupWeather",
      },
    },
    {
      kind: "emit",
      event: { type: "TOOL_CALL_ARGS", toolCallId: tid, delta: '{"city":"' },
    },
    {
      kind: "emit",
      event: { type: "TOOL_CALL_ARGS", toolCallId: tid, delta: 'SF"}' },
    },
    { kind: "emit", event: { type: "TOOL_CALL_END", toolCallId: tid } },
    {
      kind: "emit",
      event: {
        type: "TOOL_CALL_RESULT",
        toolCallId: tid,
        content: { tempF: 64, summary: "Foggy" },
      },
    },
    { kind: "emit", event: { type: "RUN_FINISHED" } },
    { kind: "wait" },
  ];
}
