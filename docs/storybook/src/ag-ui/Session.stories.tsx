import type { Meta } from "@storybook/react-webpack5";
import { createAGUIStory } from "@player-ui/storybook";
import {
  ScriptedAgent,
  a2uiFormTapeFor,
  textOnlyTapeFor,
  toolCallTapeFor,
} from "@player-ui/ag-ui-plugin-mocks";

const meta: Meta = {
  title: "AG-UI/Session",
};

export default meta;

/**
 * Streamed text reply. Each run mints a unique `messageId` so when the user
 * types a follow-up and presses Send, the new reply lands in its own bubble
 * (matching the AG-UI spec — message ids are globally unique).
 */
export const TextOnly = createAGUIStory(
  () =>
    new ScriptedAgent({
      tapeFor: (runIndex, messages) => textOnlyTapeFor(runIndex, messages),
      autoStart: true,
    }),
);

/**
 * Streamed assistant prompt followed by a `CustomEvent { name: "a2ui" }` that
 * delivers a form snapshot. Submitting the form fires `agui_submitSurface`,
 * which posts a user message + starts a new run that acknowledges the
 * submission.
 */
export const A2UIForm = createAGUIStory(
  () =>
    new ScriptedAgent({
      tapeFor: (runIndex, messages) => a2uiFormTapeFor(runIndex, messages),
      autoStart: true,
    }),
);

/**
 * Tool-call lifecycle: TOOL_CALL_START → streamed TOOL_CALL_ARGS chunks →
 * TOOL_CALL_END → TOOL_CALL_RESULT. Successive runs produce fresh
 * `toolCallId`s so the transcript accumulates multiple cards.
 */
export const ToolCall = createAGUIStory(
  () =>
    new ScriptedAgent({
      tapeFor: (runIndex) => toolCallTapeFor(runIndex),
      autoStart: true,
    }),
);
