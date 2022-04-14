import React from 'react';
import type { WebPlayer, WebPlayerPlugin } from '@player-ui/react';
import type { MetricsWebPluginOptions } from '@player-ui/metrics-plugin';
import { MetricsCorePlugin } from '@player-ui/metrics-plugin';

export * from '@player-ui/metrics-plugin';

/** A plugin to add render metrics to Player */
export class MetricsPlugin
  extends MetricsCorePlugin
  implements WebPlayerPlugin
{
  constructor(options?: MetricsWebPluginOptions) {
    // Default to `true` for tracking metrics
    super({
      trackRenderTime: options?.trackRenderTime ?? true,
      trackUpdateTime: options?.trackUpdateTime ?? true,
      ...(options ?? {}),
    });
  }

  applyWeb(webPlayer: WebPlayer) {
    if (!this.trackRender) {
      return;
    }

    /** Callback to complete the render lifecycle */
    const endRender = () => {
      this.renderEnd();
    };

    webPlayer.hooks.playerComponent.tap(this.name, (Comp) => {
      return (props) => {
        React.useEffect(endRender);

        return <Comp {...props} />;
      };
    });
  }
}
