import { ManagedPlayer } from "@player-ui/react";
import { ReferenceAssetsPlugin } from "@player-ui/reference-assets-plugin-react";
import { SuspenseSpinner } from "@player-ui/storybook";
import { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import {
    createFlowManager,
    ERROR_ASSET_FLOW,
    ERROR_CONTENT_FLOW,
    SIMPLE_FLOWS,
} from "./flows/managed";

const meta: Meta = {
  title: "React Player/Managed Player",
};

export default meta;
export const SimpleFlow: StoryObj = {
  render: () => (
    <SuspenseSpinner>
      <ManagedPlayer
        plugins={[new ReferenceAssetsPlugin()]}
        manager={createFlowManager(SIMPLE_FLOWS)}
      />
    </SuspenseSpinner>
  ),
};

export const ContentErrorHandling: StoryObj = {
  render: () => (
    <SuspenseSpinner>
      <ManagedPlayer
        plugins={[new ReferenceAssetsPlugin()]}
        manager={createFlowManager(ERROR_CONTENT_FLOW)}
      />
    </SuspenseSpinner>
  ),
};

export const AssetErrorHandling: StoryObj = {
  render: () => (
    <SuspenseSpinner>
      <ManagedPlayer
        plugins={[new ReferenceAssetsPlugin()]}
        manager={createFlowManager(ERROR_ASSET_FLOW)}
      />
    </SuspenseSpinner>
  ),
};
