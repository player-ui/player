import React from 'react';
import type {
  ReactPlayerPlugin,
  PlayerFlowStatus,
  Flow,
  ReactPlayerOptions,
} from '@player-ui/react';
import { ReactPlayer } from '@player-ui/react';
import { ChakraProvider, Spinner } from '@chakra-ui/react';
import { makeFlow } from '@player-ui/make-flow';
import addons from '@storybook/addons';
import type { AsyncImportFactory, RenderTarget } from '../types';
import { useEditorFlow } from './hooks';
import { Appetize } from './Appetize';
import { StorybookPlayerPlugin } from './storybookReactPlayerPlugin';
import { useStateActions, subscribe } from '../state/hooks';
import { PlayerFlowSummary } from './PlayerFlowSummary';

interface LocalPlayerStory {
  /** the mock to load */
  flow: Flow;

  /** Web plugins to load into Player */
  webPlugins?: Array<ReactPlayerPlugin>;
}

export const ReactPlayerPluginContext = React.createContext<{
  /** Web plugins to load into Player */
  plugins?: Array<ReactPlayerPlugin>;
}>({ plugins: [] });

export const PlayerRenderContext = React.createContext<RenderTarget>({
  platform: 'web',
});

export const StorybookControlsContext = React.createContext<{
  /** any storybook controls to include */
  controls?: Flow['data'];
}>({
  controls: {},
});

export const PlayerOptionsContext = React.createContext<{
  /**  these are options such as suspend, or plugins */
  options?: ReactPlayerOptions;
}>({ options: {} });

/** A component to render a player + flow */
const LocalPlayerStory = (props: LocalPlayerStory) => {
  let flow = useEditorFlow(props.flow);

  const renderContext = React.useContext(PlayerRenderContext);
  const pluginContext = React.useContext(ReactPlayerPluginContext);
  const controlsContext = React.useContext(StorybookControlsContext);
  const optionsContext = React.useContext(PlayerOptionsContext);
  const options = { ...optionsContext?.options };
  const stateActions = useStateActions(addons.getChannel());
  const plugins = props.webPlugins ?? pluginContext?.plugins ?? [];
  const [playerState, setPlayerState] =
    React.useState<PlayerFlowStatus>('not-started');

  const wp = React.useMemo(() => {
    return new ReactPlayer({
      ...options,
      plugins: [
        new StorybookPlayerPlugin(stateActions),
        ...plugins,
        ...(options?.plugins ?? []),
      ],
    });
  }, [plugins]);

  /** A callback to start the flow */
  const startFlow = () => {
    setPlayerState('in-progress');
    wp.start(flow)
      .then(() => {
        setPlayerState('completed');
      })
      .catch((e) => {
        console.error('Error starting flow', e);
        setPlayerState('error');
      });
  };

  React.useEffect(() => {
    startFlow();
  }, [wp, flow]);

  React.useEffect(() => {
    // merge new data from storybook controls
    if (controlsContext) {
      flow = {
        ...flow,
        data: {
          ...(flow.data ?? {}),
          ...controlsContext,
        },
      };
      stateActions.setFlow(flow);
    }
  }, [controlsContext]);

  React.useEffect(() => {
    return subscribe(addons.getChannel(), '@@player/flow/reset', () => {
      startFlow();
    });
  }, [wp, flow]);

  if (renderContext.platform !== 'web' && renderContext.token) {
    return (
      <Appetize
        flow={flow}
        platform={renderContext.platform}
        token={renderContext.token}
        baseUrl={renderContext.baseUrl}
        osVersions={renderContext.appetizeVersions}
      />
    );
  }

  const currentState = wp.player.getState();

  if (playerState === 'completed' && currentState.status === 'completed') {
    return (
      <PlayerFlowSummary
        reset={startFlow}
        outcome={currentState.endState.outcome}
      />
    );
  }

  if (playerState === 'error' && currentState.status === 'error') {
    return <PlayerFlowSummary reset={startFlow} error={currentState.error} />;
  }

  return <wp.Component />;
};

type Mock = Record<string, unknown>;
type MockFactory = () => Mock;
type MockFactoryOrPromise = MockFactory | Mock;

/** Wrap the component in a lazy type to trigger suspense */
function wrapInLazy(
  /** The component to load */
  Component: React.ComponentType<{
    /** the flow */
    flow: Flow;
  }>,

  /** A mock or a promise that resolve to a mock */
  flowFactory: AsyncImportFactory<MockFactoryOrPromise> | MockFactoryOrPromise,

  /** Any other props to pass */
  other?: any
) {
  /** an async loader to wrap the mock as a player component */
  const asPlayer = async () => {
    const mock =
      typeof flowFactory === 'function' ? await flowFactory() : flowFactory;

    /** The component to load */
    const Comp = () => {
      const flow = {
        ...makeFlow('default' in mock ? mock.default : mock),
        ...(other ?? {}),
      };
      return <Component flow={flow} />;
    };

    return {
      default: Comp,
    };
  };

  return React.lazy(asPlayer);
}

export interface PlayerStoryProps {
  /** The mock to load */
  flow: AsyncImportFactory<MockFactoryOrPromise> | MockFactoryOrPromise;
  /** Custom data to use in the flow */
  data?: Flow['data'];
  /** props from storybook controls */
  storybookControls?: Flow['data'];
  /**  options, like suspend and plugins */
  options?: ReactPlayerOptions;
}

/**
 * Takes an initial flow and renders it as a story in storybook.
 * This handles all of the wiring of the mock into the flow editor, events, etc
 */
export const PlayerStory = (props: PlayerStoryProps) => {
  const { flow, storybookControls, options, ...other } = props;

  const MockComp = React.useMemo(
    () => wrapInLazy(LocalPlayerStory, flow, other),
    []
  );

  return (
    <div>
      <ChakraProvider>
        <React.Suspense fallback={<Spinner />}>
          <StorybookControlsContext.Provider
            value={{
              ...storybookControls,
            }}
          >
            <PlayerOptionsContext.Provider
              value={{
                options,
              }}
            >
              <MockComp />
            </PlayerOptionsContext.Provider>{' '}
          </StorybookControlsContext.Provider>
        </React.Suspense>
      </ChakraProvider>
    </div>
  );
};
