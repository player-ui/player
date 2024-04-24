import type { Meta } from "@storybook/react";
import { createDSLStory } from "@player-ui/storybook-addon-player";
import { Collection } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Collection> = {
  title: "Reference Assets/Collection",
  component: Collection,
};

export default meta;

export const Basic = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/reference-assets-plugin-mocks/collection/collection-basic.tsx"
    ),
);
