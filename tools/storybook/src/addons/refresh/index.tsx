import React from 'react';
import type { API } from '@storybook/api';
import { IconButton, Icons, Separator } from '@storybook/components';
import { useStateActions } from '../../state';

interface FlowRefreshProps {
  /** storybook api */
  api: API;
}

/** BUtton to refresh the current player flow */
export const FlowRefresh = ({ api }: FlowRefreshProps) => {
  const actions = useStateActions(api.getChannel());

  return (
    <>
      <Separator />
      <IconButton
        title="Reset the current flow"
        onClick={() => {
          actions.resetFlow();
        }}
      >
        <Icons icon="sync" />
      </IconButton>
    </>
  );
};
