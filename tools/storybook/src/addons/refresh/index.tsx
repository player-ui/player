import { SyncIcon } from "@storybook/icons";
import React from "react";
import { useDispatch } from "react-redux";
import { Button, Separator } from "storybook/internal/components";
import { resetEditor } from "../../redux";

/** BUtton to refresh the current player flow */
export const FlowRefresh = () => {
  const dispatch = useDispatch();

  return (
    <>
      <Separator />
      <Button
        variant="ghost"
        padding="small"
        ariaLabel="Reset the current flow"
        title="Reset the current flow"
        onClick={() => {
          dispatch(resetEditor());
        }}
      >
        <SyncIcon />
      </Button>
    </>
  );
};
