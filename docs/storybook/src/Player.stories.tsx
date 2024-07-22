import { createDSLStory } from "@player-ui/storybook";
import { Meta } from "@storybook/react";

const meta: Meta = {
  title: "React Player",
};

export default meta;

export const ReactPlayer = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/mocks/action/action-basic.tsx"
    ),
);
