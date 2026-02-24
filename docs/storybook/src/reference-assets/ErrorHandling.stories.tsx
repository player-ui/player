import type { Meta } from "@storybook/react-webpack5";
import { createDSLStory } from "@player-ui/storybook";
import { Throwing } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Throwing> = {
  title: "Reference Assets/Error Handling",
  component: Throwing,
  parameters: {
    assetDocs: ["InputAsset"],
  },
};

export default meta;

export const RenderTime = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/throwing/throw-render.tsx"),
);

export const TransformTime = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/throwing/throw-transform.tsx"),
);
