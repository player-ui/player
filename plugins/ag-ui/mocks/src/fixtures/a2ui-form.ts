import type { A2UISnapshot } from "@player-ui/a2ui-plugin";
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
 * Two-phase scripted run: assistant introduces itself, asks a question via
 * an embedded A2UI form. Pauses so a test can submit and then run again.
 */
export const a2uiFormTape: TapeFrame[] = [
  { kind: "emit", event: { type: "RUN_STARTED", runId: "run-1" } },
  {
    kind: "emit",
    event: { type: "TEXT_MESSAGE_START", messageId: "m1", role: "assistant" },
  },
  {
    kind: "emit",
    event: {
      type: "TEXT_MESSAGE_CONTENT",
      messageId: "m1",
      delta: "Hi, mind sharing your name?",
    },
  },
  { kind: "emit", event: { type: "TEXT_MESSAGE_END", messageId: "m1" } },
  {
    kind: "emit",
    event: { type: "CUSTOM", name: "a2ui", value: formSnapshot },
  },
  { kind: "emit", event: { type: "RUN_FINISHED" } },
  { kind: "wait" },
];

export { formSnapshot };
