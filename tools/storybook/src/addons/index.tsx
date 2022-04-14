import React from 'react';
import addons, { types } from '@storybook/addons';
import {
  ADDON_ID,
  EVENT_PANEL_ID,
  FLOW_PANEL_ID,
  FLOW_REFRESH_TOOL_ID,
  RENDER_SELECT_TOOL_ID,
} from './constants';
import { EditorPanel } from './editor';
import { EventsPanel } from './events';
import { FlowRefresh } from './refresh';
import { RenderSelection } from './appetize';

/** register all the storybook addons */
export function register() {
  addons.register(ADDON_ID, (api) => {
    addons.addPanel(EVENT_PANEL_ID, {
      title: 'Events',
      render: ({ active, key }) => (
        <EventsPanel key={key} api={api} active={Boolean(active)} />
      ),
    });

    addons.addPanel(FLOW_PANEL_ID, {
      title: 'Flow',
      render: ({ active, key }) => (
        <EditorPanel key={key} api={api} active={Boolean(active)} />
      ),
    });

    // Tools show up in the top panel

    addons.add(FLOW_REFRESH_TOOL_ID, {
      title: 'Refresh Flow',
      type: types.TOOL,
      render: () => <FlowRefresh api={api} />,
    });

    addons.add(RENDER_SELECT_TOOL_ID, {
      title: 'Render Selection',
      type: types.TOOL,
      render: () => <RenderSelection api={api} />,
    });
  });
}
