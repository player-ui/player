import type { Meta } from "@storybook/react";
import { createDSLStory } from "@player-ui/storybook";
import { Text } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Text> = {
  title: "Reference Assets/Text",
  component: Text,
  parameters: {
    assetDocs: ["TextAsset"],
  },
};

export default meta;

export const Basic = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/text/text-basic.tsx"),
);
