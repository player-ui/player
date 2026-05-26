import React from "react";
import { BeaconPlugin } from "@player-ui/beacon-plugin-react";
import { AGUIReactPlayer } from "@player-ui/ag-ui";
import type { AGUIAgent } from "@player-ui/ag-ui-plugin";
import type { ReactPlayerPlugin } from "@player-ui/react";
import { useDispatch } from "react-redux";
import {
  ReactPlayerPluginContext,
  SuspenseSpinner,
} from "../player/PlayerStory";
import { StorybookPlayerPlugin } from "../player/storybookReactPlayerPlugin";

export interface AGUIStoryProps {
  /**
   * Factory that produces the agent for this story. Called once on mount and
   * again whenever the user hits "Restart" — supports tape-based agents that
   * are single-use, since each restart gets a fresh instance.
   */
  agentFactory: () => AGUIAgent;
  /** Extra ReactPlayerPlugins to register alongside the story's defaults. */
  plugins?: ReactPlayerPlugin[];
}

/**
 * Drives an `AGUIReactPlayer` against a caller-provided agent. Wired up with
 * the same `StorybookPlayerPlugin` + `BeaconPlugin` that `PlayerStory` uses,
 * so the events panel and beacon log continue to work.
 *
 * Unlike `PlayerStory`, there is no JSON editor: the "content" Player consumes
 * is the agent reference itself, which has no meaningful JSON edit form. To
 * tweak a session's behavior, edit the scripted tape (or the agent's source)
 * directly.
 */
export const AGUIStory = (props: AGUIStoryProps) => {
  const { agentFactory } = props;
  const dispatch = useDispatch();
  const pluginCtx = React.useContext(ReactPlayerPluginContext);
  const [runKey, setRunKey] = React.useState(0);

  const player = React.useMemo(() => {
    const agent = agentFactory();
    const beaconPlugin = new BeaconPlugin({ callback: () => {} });
    return {
      agent,
      instance: new AGUIReactPlayer({
        agent,
        plugins: [
          new StorybookPlayerPlugin(dispatch),
          beaconPlugin,
          ...pluginCtx.plugins,
          ...(props.plugins ?? []),
        ],
      }),
    };
    // Recreate the player on Restart so single-use scripted tapes replay.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey, dispatch]);

  React.useEffect(() => {
    player.instance
      .start(player.agent, { format: "ag-ui" })
      .catch((err) => console.error("[ag-ui story] start failed", err));
  }, [player]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          onClick={() => setRunKey((k) => k + 1)}
          style={{
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 6,
            border: "1px solid #d1d5db",
            background: "white",
            cursor: "pointer",
          }}
        >
          Restart session
        </button>
      </div>
      <div style={{ height: 560, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <SuspenseSpinner>
          <player.instance.Component />
        </SuspenseSpinner>
      </div>
    </div>
  );
};
