import type { Meta } from "@storybook/react-webpack5";
import { createA2UIStory } from "@player-ui/storybook";

const meta: Meta = {
  title: "A2UI/Expressions",
};

export default meta;

export const Showcase = createA2UIStory(
  async () =>
    (await import("@player-ui/a2ui-plugin-mocks")).expressionsShowcase,
);
