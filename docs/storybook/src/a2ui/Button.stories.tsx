import type { Meta } from "@storybook/react-webpack5";
import { createA2UIStory } from "@player-ui/storybook";

const meta: Meta = {
  title: "A2UI/Interactive/Button",
};

export default meta;

export const Basic = createA2UIStory(
  async () => (await import("@player-ui/a2ui-plugin-mocks")).buttonBasic,
);

export const WithAction = createA2UIStory(
  async () => (await import("@player-ui/a2ui-plugin-mocks")).buttonWithAction,
);
