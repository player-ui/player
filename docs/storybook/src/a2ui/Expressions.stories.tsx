import type { Meta } from "@storybook/react-webpack5";
import { createA2UIStory } from "@player-ui/storybook";

const meta: Meta = {
  title: "A2UI/Expressions",
};

export default meta;

export const Showcase = createA2UIStory(
  () => import("@player-ui/mocks/expressions/showcase.json"),
);
