import React from "react";
import type { DecoratorFunction } from "storybook/internal/types";
import { useSelector } from "react-redux";
import { StateProvider, type StateType } from "../redux";
import {
  ReactPlayerPluginContext,
  PlayerRenderContext,
  DSLPluginContext,
} from "../player";
import type { PlayerParametersType, RenderTarget } from "../types";

/** Wrap the component in a PlayerContext provider w/ proper platform attribution */
export const PlayerRenderContextWrapper = (
  props: React.PropsWithChildren<{
    /** Params for the story */
    playerParams: PlayerParametersType;
  }>,
) => {
  const { playerParams } = props;

  const platform = useSelector<StateType, RenderTarget["platform"]>(
    (s) => s.platform.platform ?? "web",
  );

  return (
    <PlayerRenderContext.Provider
      value={{
        platform,
        token:
          platform === "web"
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
export const PlayerDecorator: DecoratorFunction = (Story, ctx) => {
  const playerParams = ctx.parameters as PlayerParametersType;

  return (
    <StateProvider>
      <PlayerRenderContextWrapper playerParams={playerParams}>
        <ReactPlayerPluginContext.Provider
          value={{ plugins: playerParams.reactPlayerPlugins ?? [] }}
        >
          <DSLPluginContext.Provider value={playerParams.dslEditor ?? {}}>
            {Story() as any}
          </DSLPluginContext.Provider>
        </ReactPlayerPluginContext.Provider>
      </PlayerRenderContextWrapper>
    </StateProvider>
  );
};
