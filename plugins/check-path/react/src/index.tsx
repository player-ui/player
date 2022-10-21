import React from 'react';
import type { ReactPlayer, ReactPlayerPlugin } from '@player-ui/react';
import { CheckPathPlugin as CheckPathCorePlugin } from '@player-ui/check-path-plugin';
import { CheckPathContext } from './context';

export * from './hooks';
export * from './context';

/**
 * A plugin for adding the check-path provider to the web-player
 */
export class CheckPathPlugin
  extends CheckPathCorePlugin
  implements ReactPlayerPlugin
{
  name = 'check-path-web';

  applyReact(rp: ReactPlayer) {
    wp.hooks.webComponent.tap(this.name, (Comp) => {
      return () => (
        <CheckPathContext.Provider value={{ plugin: this }}>
          <Comp />
        </CheckPathContext.Provider>
      );
    });
  }
}
