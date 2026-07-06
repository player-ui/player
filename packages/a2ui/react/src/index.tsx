import { ReactPlayer, type ReactPlayerOptions } from "@player-ui/react";
import { A2UIPlugin } from "@player-ui/a2ui-plugin-react";

export type A2UIReactPlayerOptions = ReactPlayerOptions;

/**
 * A `ReactPlayer` preconfigured with the A2UI plugin: content-format adapter,
 * asset transforms, expression handlers, and React asset registrations.
 *
 * Extra plugins from `options.plugins` are appended after the A2UI plugin so
 * consumer-supplied taps run later and win on conflict.
 *
 * @example
 *   import { A2UIReactPlayer } from "@player-ui/a2ui";
 *
 *   const player = new A2UIReactPlayer();
 *   await player.start(snapshot, { format: "a2ui", version: "0.9" });
 */
export class A2UIReactPlayer extends ReactPlayer {
  constructor(options: A2UIReactPlayerOptions = {}) {
    super({
      ...options,
      plugins: [new A2UIPlugin(), ...(options.plugins ?? [])],
    });
  }
}

export {
  ReactPlayer,
  type ReactPlayerOptions,
  type ReactPlayerPlugin,
} from "@player-ui/react";
export { A2UIPlugin } from "@player-ui/a2ui-plugin-react";
export type { StartOptions, ContentMeta } from "@player-ui/player";
export type { A2UISnapshot, A2UIComponent } from "@player-ui/a2ui-plugin";
