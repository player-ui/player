import {
  ReactPlayer,
  type ReactPlayerOptions,
  type ReactPlayerPlugin,
} from "@player-ui/react";
import { A2UIPlugin } from "@player-ui/a2ui-plugin-react";
import { AGUIPlugin } from "@player-ui/ag-ui-plugin-react";
import type { AGUIAgent } from "@player-ui/ag-ui-plugin";

export interface AGUIReactPlayerOptions extends ReactPlayerOptions {
  /**
   * The AG-UI agent to bind this session to. Anything conforming to the
   * `AGUIAgent` interface works — `AbstractAgent` / `HttpAgent` from
   * `@ag-ui/client`, the `ScriptedAgent` from `@player-ui/ag-ui-plugin-mocks`,
   * or your own.
   */
  agent: AGUIAgent;
}

/**
 * A `ReactPlayer` preconfigured to render an AG-UI session whose agent may
 * emit A2UI snapshots inside `CustomEvent { name: "a2ui" }` payloads.
 *
 * Plugin order:
 *  1. `A2UIPlugin` (react) — registers A2UI asset renderers so surfaces
 *     embedded inside the session resolve with no extra setup.
 *  2. `AGUIPlugin` (react) — registers the AG-UI shell assets and applies the
 *     core plugin, which composes A2UI core + async-node + content/session/
 *     transform/expressions sub-plugins.
 *
 * Extra plugins from `options.plugins` are appended so consumer-supplied taps
 * run later and win on conflict.
 *
 * @example
 *   import { AGUIReactPlayer } from "@player-ui/ag-ui";
 *   import { HttpAgent } from "@ag-ui/client";
 *
 *   const agent = new HttpAgent({ url: "https://example.com/agent" });
 *   const player = new AGUIReactPlayer({ agent });
 *   await player.start(agent, { format: "ag-ui" });
 */
export class AGUIReactPlayer extends ReactPlayer {
  constructor(options: AGUIReactPlayerOptions) {
    const { agent, plugins, ...rest } = options;
    super({
      ...rest,
      plugins: [
        new A2UIPlugin() as unknown as ReactPlayerPlugin,
        new AGUIPlugin({ agent }) as unknown as ReactPlayerPlugin,
        ...(plugins ?? []),
      ],
    });
  }
}

export {
  ReactPlayer,
  type ReactPlayerOptions,
  type ReactPlayerPlugin,
} from "@player-ui/react";
export { AGUIPlugin } from "@player-ui/ag-ui-plugin-react";
export type {
  AGUIAgent,
  AGUIEvent,
  AGUIEventHandlers,
  AGUIMessage,
  AGUISubscription,
} from "@player-ui/ag-ui-plugin";
export type { A2UISnapshot } from "@player-ui/a2ui-plugin";
export type { StartOptions, ContentMeta } from "@player-ui/player";
