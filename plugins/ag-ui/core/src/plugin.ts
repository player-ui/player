import type { Player, PlayerPlugin } from "@player-ui/player";
import { MetaPlugin } from "@player-ui/meta-plugin";
import {
  AsyncNodePlugin,
  AsyncNodePluginPlugin,
} from "@player-ui/async-node-plugin";
import { A2UIPlugin } from "@player-ui/a2ui-plugin";
import {
  AGUIContentPlugin,
  AGUIExpressionsPlugin,
  AGUISessionPlugin,
  AGUITransformPlugin,
} from "./plugins";
import type { AGUIAgent } from "./session/types";

export interface AGUIPluginOptions {
  /**
   * The AG-UI agent driving this session. Must conform to the `AGUIAgent`
   * structural interface — `AbstractAgent` / `HttpAgent` from `@ag-ui/client`
   * fit out of the box; the mocks package's `ScriptedAgent` also satisfies it.
   */
  agent: AGUIAgent;
}

/**
 * Composes everything Player needs to render an AG-UI session in which the
 * agent occasionally emits `CustomEvent { name: "a2ui" }` snapshots:
 *
 *  - `AsyncNodePlugin`           — streaming primitive: each transcript seed
 *                                  and surface seed parks a deferred promise
 *                                  resolved incrementally as events arrive.
 *  - `A2UIPlugin`                — A2UI adapter / transforms / expressions so
 *                                  A2UI surfaces inside the session render.
 *  - `AGUIContentPlugin`         — taps `transformContent` to install the
 *                                  synthetic session flow when `format` is
 *                                  `"ag-ui"`.
 *  - `AGUISessionPlugin`         — subscribes to the agent's event stream,
 *                                  routes events to mutations, applies them.
 *  - `AGUIExpressionsPlugin`     — registers `agui_send`, `agui_submitSurface`,
 *                                  and `agui_cancel` for content actions.
 */
export class AGUIPlugin implements PlayerPlugin {
  name = "ag-ui-plugin";

  private readonly metaPlugin: MetaPlugin;

  constructor(opts: AGUIPluginOptions) {
    const sessionPlugin = new AGUISessionPlugin({ agent: opts.agent });
    this.metaPlugin = new MetaPlugin([
      new AsyncNodePlugin({ plugins: [new AsyncNodePluginPlugin()] }),
      new A2UIPlugin(),
      new AGUIContentPlugin({ agent: opts.agent }),
      sessionPlugin,
      new AGUIExpressionsPlugin({
        agent: opts.agent,
        onUserMessage: (msg) => sessionPlugin.pushUserMessage(msg),
      }),
      new AGUITransformPlugin(),
    ]);
  }

  apply(player: Player): void {
    player.registerPlugin(this.metaPlugin);
  }
}
