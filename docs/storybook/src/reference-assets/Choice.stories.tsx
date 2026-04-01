import type { Meta } from "@storybook/react-webpack5";
import { createDSLStory } from "@player-ui/storybook";
import { Choice } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Choice> = {
  title: "Reference Assets/Choice",
  component: Choice,
  parameters: {
    assetDocs: ["ChoiceAsset"],
  },
};

export default meta;

export const Basic = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/choice/choice-basic.tsx"),
);

export const Validation = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/choice/choice-validation.tsx"),
);
