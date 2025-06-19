import type { Meta } from "@storybook/react";
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
  () => import("@player-ui/mocks/input/input-basic.tsx?raw"),
);

export const Validation = createDSLStory(
  () => import("@player-ui/mocks/input/input-transition.tsx?raw"),
);
