import type { Meta } from "@storybook/react-webpack5";
import { createA2UIStory } from "@player-ui/storybook";

const meta: Meta = {
  title: "A2UI/Containers/Tabs",
};

export default meta;

export const Basic = createA2UIStory(
  () => import("@player-ui/mocks/tabs/basic.json"),
);
