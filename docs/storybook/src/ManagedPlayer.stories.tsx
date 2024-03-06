import React from "react";
import { SuspenseSpinner } from "@player-ui/storybook-addon-player";
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
  title: "React Player/Managed Player",
};

export default meta;
export const SimpleFlow: StoryObj = {
  render: () => {
    return (
      <SuspenseSpinner>
        <ManagedPlayer
          plugins={[new ReferenceAssetsPlugin()]}
          manager={createFlowManager(SIMPLE_FLOWS)}
        />
      </SuspenseSpinner>
    );
  },
};

export const ContentErrorHandling: StoryObj = {
  render: () => {
    return (
      <SuspenseSpinner>
        <ManagedPlayer
          plugins={[new ReferenceAssetsPlugin()]}
          manager={createFlowManager(ERROR_CONTENT_FLOW)}
        />
      </SuspenseSpinner>
    );
  },
};

export const AssetErrorHandling: StoryObj = {
  render: () => {
    return (
      <SuspenseSpinner>
        <ManagedPlayer
          plugins={[new ReferenceAssetsPlugin()]}
          manager={createFlowManager(ERROR_ASSET_FLOW)}
        />
      </SuspenseSpinner>
    );
  },
};
