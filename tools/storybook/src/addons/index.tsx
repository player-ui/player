import React from "react";
import { addons, types } from "@storybook/manager-api";
import {
  ADDON_ID,
  EVENT_PANEL_ID,
  FLOW_PANEL_ID,
  FLOW_REFRESH_TOOL_ID,
  RENDER_SELECT_TOOL_ID,
} from "./constants";
import { EditorPanel } from "./editor";
import { EventsPanel } from "./events";
import { FlowRefresh } from "./refresh";
import { RenderSelection } from "./appetize";
import { StateProvider } from "../redux";

/** register all the storybook addons */
export function register() {
  addons.register(ADDON_ID, (api) => {
    addons.addPanel(EVENT_PANEL_ID, {
      title: "Events",
      render: ({ active, key }) => (
        <StateProvider key={key}>
          <EventsPanel active={Boolean(active)} />
        </StateProvider>
      ),
    });

    addons.addPanel(FLOW_PANEL_ID, {
      title: "Flow",
      render: ({ active, key }) => (
        <StateProvider key={key}>
          <EditorPanel active={Boolean(active)} />
        </StateProvider>
      ),
    });

    // Tools show up in the top panel

    addons.add(FLOW_REFRESH_TOOL_ID, {
      title: "Refresh Flow",
      type: types.TOOL,
      render: () => (
        <StateProvider>
          <FlowRefresh />
        </StateProvider>
      ),
    });

    addons.add(RENDER_SELECT_TOOL_ID, {
      title: "Render Selection",
      type: types.TOOL,
      render: () => (
        <StateProvider>
          <RenderSelection api={api} />
        </StateProvider>
      ),
    });
  });
}
