import type {
  ExtendedPlayerPlugin,
  Player,
  ReactPlayer,
  ReactPlayerPlugin,
} from "@player-ui/react";
import { AssetProviderPlugin } from "@player-ui/asset-provider-plugin-react";
import {
  AGUIPlugin as AGUICorePlugin,
  type AGUIPluginOptions,
} from "@player-ui/ag-ui-plugin";
import {
  AGUIInputBar,
  AGUIReasoning,
  AGUISession,
  AGUISurface,
  AGUITextMessage,
  AGUITranscript,
  AGUIToolCall,
} from "./assets";

/**
 * Registers the React renderers for the AG-UI shell: session layout,
 * transcript list, message bubbles, reasoning, tool calls, surface region,
 * and input bar. Also applies the core `AGUIPlugin` so a consumer only
 * needs to register this single React plugin to get the full session.
 */
export class AGUIPlugin implements ReactPlayerPlugin, ExtendedPlayerPlugin {
  name = "ag-ui-web-plugin";

  constructor(private readonly opts: AGUIPluginOptions) {}

  applyReact(reactPlayer: ReactPlayer): void {
    reactPlayer.registerPlugin(
      new AssetProviderPlugin([
        ["agui-session", AGUISession],
        ["agui-transcript", AGUITranscript],
        ["agui-text-message", AGUITextMessage],
        ["agui-reasoning", AGUIReasoning],
        ["agui-tool-call", AGUIToolCall],
        ["agui-input-bar", AGUIInputBar],
        ["agui-surface", AGUISurface],
      ]),
    );
  }

  apply(player: Player): void {
    player.registerPlugin(new AGUICorePlugin(this.opts));
  }
}
