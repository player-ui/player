import { useReactPlayer } from "@player-ui/react";
import { Loader, Placeholder } from "@storybook/components";
import { API } from "@storybook/manager-api";
import React, { Suspense } from "react";
import { useDispatch } from "react-redux";
import { ReferenceAssetsPlugin } from "@player-ui/reference-assets-plugin";
import { setControlData, usePlayerStoryControls } from "../../redux";
import { useDarkMode } from "../useDarkMode";
import { controlsAssetsPlugin } from "./controls-player-plugin";
import { ErrorBoundary } from "react-error-boundary";

interface ControlsPanelProps {
  /** if the panel is shown */
  active: boolean;

  /** Storybook manager API */
  api: API;
}

/** The panel to show events */
export const ControlsPanel = (props: ControlsPanelProps) => {
  const controlsContent = usePlayerStoryControls();
  const darkMode = useDarkMode(props.api);
  const dispatch = useDispatch();

  const wp = useReactPlayer({
    plugins: [controlsAssetsPlugin, new ReferenceAssetsPlugin()],
  });

  React.useEffect(() => {
    wp.player.hooks.dataController.tap("controls-panel", (dc) => {
      dc.hooks.onUpdate.tap("controls-panel", () => {
        dispatch(setControlData(dc.serialize()));
      });
    });

    if (controlsContent) {
      wp.reactPlayer.start(controlsContent.flow).catch((e) => {
        console.error("error starting controls content", e);
      });
    }
  }, [controlsContent, dispatch]);

  if (!props.active) {
    return null;
  }

  if (controlsContent === undefined) {
    return (
      <Placeholder>
        This story is not configured to receive Player events.
      </Placeholder>
    );
  }

  return (
    <div>
      <ErrorBoundary
        onError={(e) => {
          console.error("Rendering Error", e);
        }}
        fallback={<div>Error</div>}
      >
        <Suspense fallback={<Loader />}>
          <wp.reactPlayer.Component />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
};
