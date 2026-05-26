import type { A2UISnapshot } from "@player-ui/a2ui-plugin";
import type { AGUIMessage } from "@player-ui/ag-ui-plugin";
import type { TapeFrame } from "../scripted-agent";

const formSnapshot: A2UISnapshot = {
  surfaceId: "feedback-form",
  components: [
    {
      id: "root",
      component: "Column",
      children: ["title", "name", "submit"],
    },
    { id: "title", component: "Text", text: "Quick question" },
    {
      id: "name",
      component: "TextField",
      label: "Your name",
      value: { path: "/form/name" },
    },
    {
      id: "submit",
      component: "Button",
      child: "submit-label",
      action: {
        event: {
          name: "submitFeedback",
          context: { name: { path: "/form/name" } },
        },
      },
    },
    { id: "submit-label", component: "Text", text: "Submit" },
  ],
  data: { form: { name: "" } },
};

/**
 * Per-run factory:
 *  - Run 0: assistant introduces, asks via the embedded A2UI form, then waits.
 *  - Run 1+: assistant acknowledges the submitted name (or whatever the user
 *    sent) and waits for the next turn.
 */
export function a2uiFormTapeFor(
  runIndex: number,
  messages: AGUIMessage[],
): TapeFrame[] {
  const runId = `run-${runIndex}`;
  if (runIndex === 0) {
    const mid = `m-${runIndex}-1`;
    return [
      { kind: "emit", event: { type: "RUN_STARTED", runId } },
      {
        kind: "emit",
        event: {
          type: "TEXT_MESSAGE_START",
          messageId: mid,
          role: "assistant",
        },
      },
      {
        kind: "emit",
        event: {
          type: "TEXT_MESSAGE_CONTENT",
          messageId: mid,
          delta: "Hi, mind sharing your name?",
        },
      },
      { kind: "emit", event: { type: "TEXT_MESSAGE_END", messageId: mid } },
      {
        kind: "emit",
        event: { type: "CUSTOM", name: "a2ui", value: formSnapshot },
      },
      { kind: "emit", event: { type: "RUN_FINISHED" } },
      { kind: "wait" },
    ];
  }
  const last = [...messages].reverse().find((m) => m.role === "user");
  const name = (last?.data as { name?: string } | undefined)?.name ?? "friend";
  const mid = `m-${runIndex}-1`;
  return [
    { kind: "emit", event: { type: "RUN_STARTED", runId } },
    {
      kind: "emit",
      event: { type: "TEXT_MESSAGE_START", messageId: mid, role: "assistant" },
    },
    {
      kind: "emit",
      event: {
        type: "TEXT_MESSAGE_CONTENT",
        messageId: mid,
        delta: `Nice to meet you, ${name}.`,
      },
    },
    { kind: "emit", event: { type: "TEXT_MESSAGE_END", messageId: mid } },
    { kind: "emit", event: { type: "RUN_FINISHED" } },
    { kind: "wait" },
  ];
}

export { formSnapshot };
