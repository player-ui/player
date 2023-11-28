import React from "react";
import type { ReactPlayer, ReactPlayerPlugin } from "@player-ui/react";
import type { MetricsWebPluginOptions } from "@player-ui/metrics-plugin";
import { MetricsCorePlugin } from "@player-ui/metrics-plugin";

export * from "@player-ui/metrics-plugin";

/** A plugin to add render metrics to Player */
export class MetricsPlugin
  extends MetricsCorePlugin
  implements ReactPlayerPlugin
{
  constructor(options?: MetricsWebPluginOptions) {
    // Default to `true` for tracking metrics
    super({
      trackRenderTime: options?.trackRenderTime ?? true,
      trackUpdateTime: options?.trackUpdateTime ?? true,
      ...(options ?? {}),
    });
  }

  applyReact(reactPlayer: ReactPlayer) {
    if (!this.trackRender) {
      return;
    }

    /** Callback to complete the render lifecycle */
    const endRender = () => {
      this.renderEnd();
    };

    reactPlayer.hooks.playerComponent.tap(this.name, (Comp) => {
      return function MetricsWrapper(props) {
        React.useEffect(endRender);

        return <Comp {...props} />;
      };
    });
  }
}
