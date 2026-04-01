import { Action } from "@player-ui/reference-assets-plugin-react";
import { createDSLStory, PlayerStory } from "@player-ui/storybook";
import type { Meta } from "@storybook/react-webpack5";
import React from "react";

const meta: Meta<typeof Action> = {
  title: "Reference Assets/Action",
  component: Action,
  parameters: {
    assetDocs: ["ActionAsset"],
  },
};

export default meta;

export const Basic = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/action/action-basic.tsx"),
);

export const Expression = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/action/action-counter.tsx"),
);

export const Navigation = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/action/action-navigation.tsx"),
);

export const TransitionToEnd = () => (
  <PlayerStory
    flow={() => import("@player-ui/mocks/action/action-transition-to-end.json")}
  />
);
