import React from 'react';
import type { DecoratorFn } from '@storybook/react';
import addons from '@storybook/addons';
import type { PlatformSetType } from '../state/hooks';
import { subscribe } from '../state/hooks';
import { ReactPlayerPluginContext, PlayerRenderContext } from '../player';
import type { PlayerParametersType, RenderTarget } from '../types';

/**
 * A story decorator for rendering player content
 */
export const PlayerDecorator: DecoratorFn = (story, ctx) => {
  const playerParams = ctx.parameters as PlayerParametersType;
  const [selectedPlatform, setPlatform] =
    React.useState<RenderTarget['platform']>('web');

  React.useEffect(() => {
    return subscribe<PlatformSetType>(
      addons.getChannel(),
      '@@player/platform/set',
      (evt) => {
        setPlatform(evt.platform);
      }
    );
  }, []);

  return (
    <PlayerRenderContext.Provider
      value={{
        platform: selectedPlatform,
        token:
          selectedPlatform === 'web'
            ? undefined
            : playerParams?.appetizeTokens?.[selectedPlatform],
        baseUrl: playerParams.appetizeBaseUrl,
        appetizeVersions: playerParams.appetizeVersions,
      }}
    >
      <ReactPlayerPluginContext.Provider
        value={{ plugins: playerParams.reactPlayerPlugins }}
      >
        {story()}
      </ReactPlayerPluginContext.Provider>
    </PlayerRenderContext.Provider>
  );
};
