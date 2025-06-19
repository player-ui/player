import type { Meta } from "@storybook/react";
import { createDSLStory, PlayerStory } from "@player-ui/storybook";
import { Action } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Action> = {
  title: "Reference Assets/Action",
  component: Action,
  parameters: {
    assetDocs: ["ActionAsset"],
  },
};

export default meta;

export const Basic = createDSLStory(
  () => import("@player-ui/mocks/action/action-basic.tsx?raw"),
);

export const Expression = createDSLStory(
  () => import("@player-ui/mocks/action/action-counter.tsx?raw"),
);

export const Navigation = createDSLStory(
  () => import("@player-ui/mocks/action/action-navigation.tsx?raw"),
);

export const TransitionToEnd = () => (
  <PlayerStory
    flow={() => import("@player-ui/mocks/action/action-transition-to-end.json")}
  />
);
