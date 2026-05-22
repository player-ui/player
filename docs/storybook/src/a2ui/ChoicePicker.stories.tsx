import type { Meta } from "@storybook/react-webpack5";
import { createA2UIStory } from "@player-ui/storybook";

const meta: Meta = {
  title: "A2UI/Interactive/ChoicePicker",
};

export default meta;

export const SingleSelect = createA2UIStory(
  () => import("@player-ui/mocks/choice-picker/single-select.json"),
);

export const MultiSelect = createA2UIStory(
  () => import("@player-ui/mocks/choice-picker/multi-select.json"),
);
