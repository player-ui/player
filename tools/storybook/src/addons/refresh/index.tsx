import React from 'react';
import { IconButton, Icons, Separator } from '@storybook/components';
import { useDispatch } from 'react-redux';
import { resetEditor } from '../../redux';

/** BUtton to refresh the current player flow */
export const FlowRefresh = () => {
  const dispatch = useDispatch();

  return (
    <>
      <Separator />
      <IconButton
        title="Reset the current flow"
        onClick={() => {
          dispatch(resetEditor());
        }}
      >
        <Icons icon="sync" />
      </IconButton>
    </>
  );
};
