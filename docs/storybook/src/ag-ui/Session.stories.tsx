import type { Meta } from "@storybook/react-webpack5";
import { createAGUIStory } from "@player-ui/storybook";
import {
  ScriptedAgent,
  a2uiFormTape,
  textOnlyTape,
  toolCallTape,
} from "@player-ui/ag-ui-plugin-mocks";

const meta: Meta = {
  title: "AG-UI/Session",
};

export default meta;

/**
 * Single-turn streamed assistant reply. Exercises the streaming text path
 * (TEXT_MESSAGE_START → repeated TEXT_MESSAGE_CONTENT → TEXT_MESSAGE_END) plus
 * RUN_STARTED / RUN_FINISHED status toggling on the input bar.
 */
export const TextOnly = createAGUIStory(
  () => new ScriptedAgent({ tape: textOnlyTape, autoStart: true }),
);

/**
 * Streamed assistant prompt followed by a `CustomEvent { name: "a2ui" }` that
 * delivers a form snapshot. The form's submit action wires back through the
 * `agui_submitSurface` expression — exactly the off-the-shelf contract for
 * A2UI surfaces inside an AG-UI run.
 */
export const A2UIForm = createAGUIStory(
  () => new ScriptedAgent({ tape: a2uiFormTape, autoStart: true }),
);

/**
 * Tool-call lifecycle: TOOL_CALL_START → streamed TOOL_CALL_ARGS chunks →
 * TOOL_CALL_END → TOOL_CALL_RESULT. The tool-call card renders args as they
 * arrive and shows the JSON result once it lands.
 */
export const ToolCall = createAGUIStory(
  () => new ScriptedAgent({ tape: toolCallTape, autoStart: true }),
);
