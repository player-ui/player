import React from "react";
import { IconButton, Separator } from "storybook/internal/components";
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
        value="Flow Reset"
        title="Reset the current flow"
        onPointerOverCapture={() => {}}
        onPointerMoveCapture={() => {}}
        onClick={() => {
          dispatch(resetEditor());
        }}
      >
        <SyncIcon />
      </IconButton>
    </>
  );
};
