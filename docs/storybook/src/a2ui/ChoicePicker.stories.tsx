import type { Meta } from "@storybook/react-webpack5";
import { createA2UIStory } from "@player-ui/storybook";

const meta: Meta = {
  title: "A2UI/Interactive/ChoicePicker",
};

export default meta;

export const SingleSelect = createA2UIStory(
  async () => (await import("@player-ui/a2ui-plugin-mocks")).choicePickerSingle,
);

export const MultiSelect = createA2UIStory(
  async () => (await import("@player-ui/a2ui-plugin-mocks")).choicePickerMulti,
);
