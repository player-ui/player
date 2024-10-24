import React, { PropsWithChildren } from "react";
import type {
  ReactPlayerOptions,
  ReactPlayerPlugin,
  PlayerFlowStatus,
  Flow,
} from "@player-ui/react";
import { ReactPlayer } from "@player-ui/react";
import { BeaconPlugin } from "@player-ui/beacon-plugin-react";
import { makeFlow } from "@player-ui/make-flow";
import { Placeholder } from "@storybook/components";
import { useDispatch, useSelector } from "react-redux";
import { addons } from "@storybook/preview-api";
import type {
  AsyncImportFactory,
  PlayerParametersType,
  RenderTarget,
} from "../types";
import { Appetize } from "./Appetize";
import { StorybookPlayerPlugin } from "./storybookReactPlayerPlugin";
import { PlayerFlowSummary } from "./PlayerFlowSummary";
import type { StateType } from "../redux";
import {
  useContentKind,
  useCompiledEditorValue,
  useInitialJsonEditorValue,
  useJSONEditorValue,
  usePlayerStoryControls,
} from "../redux";
import { useFlowSetListener } from "./useFlowSet";

interface LocalPlayerStory {
  /** the mock to load */
  mock: Flow;

  /** plugins to the player */
  webPlugins?: Array<ReactPlayerPlugin>;
}

export const ReactPlayerPluginContext = React.createContext<{
  /** Plugins to use for the player */
  plugins: Array<ReactPlayerPlugin>;
}>({ plugins: [] });

export const DSLPluginContext = React.createContext<
  PlayerParametersType["dslEditor"]
>({});

export const PlayerRenderContext = React.createContext<RenderTarget>({
  platform: "web",
});

export const StorybookControlsContext = React.createContext<{
  /** any storybook controls to include */
  controls?: Flow["data"];
}>({
  controls: {},
});

export const PlayerOptionsContext = React.createContext<{
  /**  these are options such as suspend, or plugins */
  options?: ReactPlayerOptions;
}>({ options: {} });

export const SuspenseSpinner = (props: PropsWithChildren) => {
  return (
    <React.Suspense fallback={<div className="sb-loader" />}>
      {props.children}
    </React.Suspense>
  );
};
/** A Component to render the current JSON editor value inside of Player */
const PlayerJsonEditorStory = () => {
  const jsonEditorValue = useJSONEditorValue();
  useFlowSetListener(addons.getChannel());

  const { plugins } = React.useContext(ReactPlayerPluginContext);

  const controlsData = usePlayerStoryControls();

  const dispatch = useDispatch();

  const [playerState, setPlayerState] =
    React.useState<PlayerFlowStatus>("not-started");

  const [trackedBeacons, setTrackedBeacons] = React.useState<any[]>([]);
  const [key, setKey] = React.useState<string | undefined>();

  const wp = React.useMemo(() => {
    const beaconPlugin = new BeaconPlugin({
      callback: (beacon) => {
        setTrackedBeacons((t) => [...t, beacon]);
      },
    });

    return new ReactPlayer({
      plugins: [new StorybookPlayerPlugin(dispatch), beaconPlugin, ...plugins],
    });
  }, [dispatch, plugins]);

  React.useEffect(() => {
    const playerState = wp.player.getState();

    console.log("Updating Player");

    if (playerState.status !== "in-progress" || !controlsData) {
      return;
    }

    playerState.controllers.data.set(controlsData.data, {
      silent: false,
    });
  }, [wp, controlsData]);

  /** A callback to start the flow */
  const startFlow = () => {
    if (jsonEditorValue?.state !== "loaded") {
      return;
    }

    setPlayerState("in-progress");
    setTrackedBeacons([]);

    setKey(jsonEditorValue.value.id);

    wp.start(jsonEditorValue.value)
      .then(() => {
        setPlayerState("completed");
      })
      .catch((e) => {
        console.error("Error starting flow", e);
        setPlayerState("error");
      });
  };

  React.useEffect(() => {
    startFlow();
  }, [wp, jsonEditorValue]);

  const currentState = wp.player.getState();

  if (playerState === "completed" && currentState.status === "completed") {
    return (
      <PlayerFlowSummary
        reset={startFlow}
        completedState={currentState}
        beacons={trackedBeacons}
      />
    );
  }

  if (playerState === "error" && currentState.status === "error") {
    return <PlayerFlowSummary reset={startFlow} error={currentState.error} />;
  }

  return (
    <SuspenseSpinner>
      <wp.Component key={key} />
    </SuspenseSpinner>
  );
};

/** A component to render a player + flow */
const LocalPlayerStory = (props: LocalPlayerStory) => {
  const flow = useInitialJsonEditorValue(props.mock);
  const platform = useSelector<StateType>((state) => state.platform.platform);
  const renderContext = React.useContext(PlayerRenderContext);
  const webPlayerContext = React.useContext(ReactPlayerPluginContext);
  const { options } = React.useContext(PlayerOptionsContext);

  if (platform === "web") {
    return (
      <ReactPlayerPluginContext.Provider
        value={
          props.webPlugins || options?.plugins
            ? {
                ...webPlayerContext,
                plugins: [
                  ...webPlayerContext.plugins,
                  ...(props.webPlugins ?? []),
                  ...(options?.plugins ?? []),
                ],
              }
            : webPlayerContext
        }
      >
        <PlayerJsonEditorStory />
      </ReactPlayerPluginContext.Provider>
    );
  }

  if (
    renderContext.platform !== "web" &&
    renderContext.token &&
    flow?.state === "loaded"
  ) {
    return (
      <Appetize
        flow={flow.value}
        platform={renderContext.platform}
        token={renderContext.token}
        baseUrl={renderContext.baseUrl}
        osVersions={renderContext.appetizeVersions}
      />
    );
  }

  return <Placeholder>Unable to render flow</Placeholder>;
};

type Mock = Record<string, unknown>;
type MockFactory = () => Mock;
type MockFactoryOrPromise = MockFactory | Mock;

/** Wrap the component in a lazy type to trigger suspense */
function wrapInLazy(
  /** The component to load */
  Component: React.ComponentType<{
    /** the flow */
    mock: Flow;
  }>,

  /** A mock or a promise that resolve to a mock */
  mockFactory: AsyncImportFactory<MockFactoryOrPromise> | MockFactoryOrPromise,

  /** Any other props to pass */
  other?: any,
) {
  /** an async loader to wrap the mock as a player component */
  const asPlayer = async () => {
    const mock =
      typeof mockFactory === "function" ? await mockFactory() : mockFactory;

    /** The component to load */
    const Comp = () => {
      const flow = {
        ...makeFlow("default" in mock ? mock.default : mock),
        ...(other ?? {}),
      };

      return <Component mock={flow} />;
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
  data?: Flow["data"];
  /** props from storybook controls */
  storybookControls?: Flow["data"];
  /**  options, like suspend and plugins */
  options?: ReactPlayerOptions;
}

/**
 * Takes an initial flow and renders it as a story in storybook.
 * This handles all of the wiring of the mock into the flow editor, events, etc
 */
export const PlayerStory = (props: PlayerStoryProps) => {
  const { flow, storybookControls, options, ...other } = props;
  useContentKind("json");

  const MockComp = React.useMemo(
    () => wrapInLazy(LocalPlayerStory, flow, other),
    [],
  );

  return (
    <div>
      <SuspenseSpinner>
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
          </PlayerOptionsContext.Provider>
        </StorybookControlsContext.Provider>
      </SuspenseSpinner>
    </div>
  );
};

/** A DSL story that compiles code */
export const DSLLocalPlayerStory = (
  props: Omit<PlayerStoryProps, "flow"> & {
    /** Initial state of the dsl content */
    dslContent: string;

    controlsContent?: () => Promise<Flow>;
  },
) => {
  const dslContext = React.useContext(DSLPluginContext);
  useContentKind("dsl");

  useCompiledEditorValue(props.dslContent, {
    additionalModules: dslContext?.additionalModules,
  });

  usePlayerStoryControls(props.controlsContent);

  return <PlayerJsonEditorStory />;
};

export const toLazyStory = (
  dslContent: () => Promise<
    | string
    | {
        /** The default export of the module */
        default: string;
      }
  >,
  other: any,
) => {
  /** A function to load the flow for use in a lazy component */
  const loadFlow = async () => {
    let content = await dslContent();

    if (typeof content === "object") {
      content = content.default;
    }

    return {
      default: () => {
        return (
          <DSLLocalPlayerStory dslContent={content as string} {...other} />
        );
      },
    };
  };

  return React.lazy(loadFlow);
};

/** A DSL story that handles lazy-loaded content */
export const DSLPlayerStory = (
  props: Omit<PlayerStoryProps, "flow"> & {
    /** Initial state of the dsl content */
    dslContent: () => Promise<
      | string
      | {
          /** The default export of the module */
          default: string;
        }
    >;

    controlsContent?: () => Promise<Flow>;
  },
) => {
  const { dslContent, ...other } = props;

  const AsLazyComp = React.useMemo(() => {
    return toLazyStory(dslContent, other);
  }, [dslContent]);

  return (
    <SuspenseSpinner>
      <AsLazyComp />
    </SuspenseSpinner>
  );
};
