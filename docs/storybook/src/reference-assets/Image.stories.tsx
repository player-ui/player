import type { Meta } from "@storybook/react";
import { createDSLStory } from "@player-ui/storybook";
import { Image } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Image> = {
  title: "Reference Assets/Image",
  component: Image,
};

export default meta;

export const Basic = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/mocks/image/image-basic.tsx"
    ),
);

export const Caption = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/mocks/image/image-with-caption.tsx"
    ),
);

export const Accessibility = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/mocks/image/image-with-accessibility.tsx"
    ),
);

export const Placeholder = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/mocks/image/image-with-placeholder.tsx"
    ),
);
