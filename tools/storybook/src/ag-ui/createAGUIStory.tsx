import React from "react";
import type { AGUIAgent } from "@player-ui/ag-ui-plugin";
import { AGUIStory } from "./AGUIStory";

export type AGUIAgentFactory = () => AGUIAgent;

export interface AGUIStoryOptions {
  /** Storybook controls — surfaced as `Comp.args` so they round-trip. */
  args?: Record<string, unknown>;
}

/**
 * Story factory for AG-UI sessions. Pass a function that builds the agent —
 * called fresh on every mount and on every "Restart" click, so single-use
 * scripted tapes can replay cleanly across re-renders.
 *
 * @example
 *   import { createAGUIStory } from "@player-ui/storybook";
 *   import { ScriptedAgent, textOnlyTape } from "@player-ui/ag-ui-plugin-mocks";
 *
 *   export const TextOnly = createAGUIStory(
 *     () => new ScriptedAgent({ tape: textOnlyTape }),
 *   );
 */
export function createAGUIStory(
  agentFactory: AGUIAgentFactory,
  options?: AGUIStoryOptions,
) {
  const Comp = () => <AGUIStory agentFactory={agentFactory} />;
  if (options?.args)
    (Comp as unknown as { args?: Record<string, unknown> }).args = options.args;
  return { render: Comp };
}
