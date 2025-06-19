import type { Meta } from "@storybook/react";
import { createDSLStory } from "@player-ui/storybook";
import { Image } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Image> = {
  title: "Reference Assets/Image",
  component: Image,
  parameters: {
    assetDocs: ["ImageAsset"],
  },
};

export default meta;

export const Basic = createDSLStory(
  () => import("@player-ui/mocks/image/image-basic.tsx?raw"),
);

export const Caption = createDSLStory(
  () => import("@player-ui/mocks/image/image-with-caption.tsx?raw"),
);

export const Accessibility = createDSLStory(
  () =>
    import("@player-ui/mocks/image/image-with-accessibility.tsx?raw"),
);

export const Placeholder = createDSLStory(
  () =>
    import("@player-ui/mocks/image/image-with-placeholder.tsx?raw"),
);
