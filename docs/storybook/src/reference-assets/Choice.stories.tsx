import type { Meta } from "@storybook/react";
import { createDSLStory } from "@player-ui/storybook-addon-player";
import { Choice } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Choice> = {
  title: "Reference Assets/Choice",
  component: Choice,
};

export default meta;

export const Basic = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/mocks/choice/choice-basic.tsx"
    ),
);

export const Validation = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/mocks/choice/choice-validation.tsx"
    ),
);
