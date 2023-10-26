import React from 'react';
import type { DecoratorFn } from '@storybook/react';
import { useSelector } from 'react-redux';
import type { StateType } from '../redux';
import { StateProvider } from '../redux';
import {
  ReactPlayerPluginContext,
  PlayerRenderContext,
  DSLPluginContext,
} from '../player';
import type { PlayerParametersType, RenderTarget } from '../types';

/** Wrap the component in a PlayerContext provider w/ proper platform attribution */
const PlayerRenderContextWrapper = (
  props: React.PropsWithChildren<{
    /** Params for the story */
    playerParams: PlayerParametersType;
  }>
) => {
  const { playerParams } = props;

  const platform = useSelector<StateType, RenderTarget['platform']>(
    (s) => s.platform.platform ?? 'web'
  );

  return (
    <PlayerRenderContext.Provider
      value={{
        platform,
        token:
          platform === 'web'
            ? undefined
            : playerParams?.appetizeTokens?.[platform],
        baseUrl: playerParams.appetizeBaseUrl,
        appetizeVersions: playerParams.appetizeVersions,
      }}
    >
      {props.children}
    </PlayerRenderContext.Provider>
  );
};

/**
 * A story decorator for rendering player content
 */
export const PlayerDecorator: DecoratorFn = (story, ctx) => {
  const playerParams = ctx.parameters as PlayerParametersType;

  return (
    <StateProvider>
      <PlayerRenderContextWrapper playerParams={playerParams}>
        <ReactPlayerPluginContext.Provider
          value={{ plugins: playerParams.reactPlayerPlugins ?? [] }}
        >
          <DSLPluginContext.Provider value={playerParams.dslEditor ?? {}}>
            {story()}
          </DSLPluginContext.Provider>
        </ReactPlayerPluginContext.Provider>
      </PlayerRenderContextWrapper>
    </StateProvider>
  );
};
