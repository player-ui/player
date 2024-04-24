import type { Meta } from "@storybook/react";
import { createDSLStory } from "@player-ui/storybook-addon-player";
import { Input } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Input> = {
  title: "Reference Assets/Input",
  component: Input,
};

export default meta;

export const Basic = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/reference-assets-plugin-mocks/input/input-basic.tsx"
    ),
);

export const Validation = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/reference-assets-plugin-mocks/input/input-transition.tsx"
    ),
);
