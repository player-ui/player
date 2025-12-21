import type { Meta } from "@storybook/react-webpack5";
import { createDSLStory } from "@player-ui/storybook";
import { Input } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Input> = {
  title: "Reference Assets/Input",
  component: Input,
  parameters: {
    assetDocs: ["InputAsset"],
  },
};

export default meta;

export const Basic = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/input/input-basic.tsx"),
);

export const Validation = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/input/input-transition.tsx"),
);
