import React from "react";
import { Separator, IconButton } from "storybook/internal/components";
import { SyncIcon } from "@storybook/icons";
import { useDispatch } from "react-redux";
import { resetEditor } from "../../redux";

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
        <SyncIcon />
      </IconButton>
    </>
  );
};
