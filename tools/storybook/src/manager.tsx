import React from "react";
import { addons, types } from "storybook/manager-api";
import {
  ADDON_ID,
  DOCS_PANEL_ID,
  EVENT_PANEL_ID,
  FLOW_PANEL_ID,
  FLOW_REFRESH_TOOL_ID,
} from "./addons/constants";
import { DocsPanel } from "./addons/docs";
import { EditorPanel } from "./addons/editor";
import { EventsPanel } from "./addons/events";
import { FlowRefresh } from "./addons/refresh";
import { StateProvider } from "./redux";

export const register = () => {
  addons.register(ADDON_ID, (api) => {
    addons.add(DOCS_PANEL_ID, {
      type: types.PANEL,
      title: "Asset Docs",
      match: ({ viewMode }) => viewMode === "story",
      render: ({ active }) => (
        <StateProvider>
          <DocsPanel api={api} active={active} />
        </StateProvider>
      ),
    });

    addons.add(EVENT_PANEL_ID, {
      type: types.PANEL,
      title: "Events",
      match: ({ viewMode }) => viewMode === "story",
      render: ({ active }) => (
        <StateProvider>
          <EventsPanel api={api} active={Boolean(active)} />
        </StateProvider>
      ),
    });

    addons.add(FLOW_PANEL_ID, {
      type: types.PANEL,
      title: "Flow Editor",
      match: ({ viewMode }) => viewMode === "story",
      render: ({ active }) => (
        <StateProvider>
          <EditorPanel api={api} active={Boolean(active)} />
        </StateProvider>
      ),
    });

    addons.add(FLOW_REFRESH_TOOL_ID, {
      title: "Refresh Flow",
      type: types.TOOL,
      match: ({ viewMode }) => viewMode === "story",
      render: () => (
        <StateProvider>
          <FlowRefresh />
        </StateProvider>
      ),
    });
  });
};

// /** register all the storybook addons */
// export function register() {
//   addons.register(ADDON_ID, (api) => {

//     // Tools show up in the top panel

//     addons.add(RENDER_SELECT_TOOL_ID, {
//       title: "Render Selection",
//       type: types.TOOL,
//       render: () => (
//         <StateProvider>
//           <RenderSelection api={api} />
//         </StateProvider>
//       ),
//     });
//   });
// }
