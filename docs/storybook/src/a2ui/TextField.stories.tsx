import type { Meta } from "@storybook/react-webpack5";
import { createA2UIStory } from "@player-ui/storybook";

const meta: Meta = {
  title: "A2UI/Interactive/TextField",
};

export default meta;

export const Basic = createA2UIStory(
  () => import("@player-ui/a2ui-plugin-mocks/text-field/basic.json"),
);

export const Validation = createA2UIStory(
  () => import("@player-ui/a2ui-plugin-mocks/text-field/validation.json"),
);
