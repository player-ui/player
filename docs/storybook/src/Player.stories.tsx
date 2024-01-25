import React, { Suspense } from "react";
import { ErrorHandler, StoryWrapper } from "./components";
// import { ManagedPlayer } from "@player-ui/react";
import {
  PlayerStory,
  SuspenseSpinner,
} from "@player-ui/storybook-addon-player";
import { Meta, StoryObj } from "@storybook/react";
import { ManagedPlayer } from "@player-ui/react";
import { ReferenceAssetsPlugin } from "@player-ui/reference-assets-plugin-react";
import {
  createFlowManager,
  SIMPLE_FLOWS,
  ERROR_CONTENT_FLOW,
  ERROR_ASSET_FLOW,
} from "./flows/managed";

const meta: Meta = {
  title: "React Player",
};

export default meta;

export const ReactPlayer: StoryObj = {
  render: () => {
    return <PlayerStory flow={() => import("./flows/basic-action")} />;
  },
};
