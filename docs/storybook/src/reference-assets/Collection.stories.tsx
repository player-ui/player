import type { Meta } from "@storybook/react-vite";
import { createDSLStory } from "@player-ui/storybook";
import { Collection } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Collection> = {
  title: "Reference Assets/Collection",
  component: Collection,
  parameters: {
    assetDocs: ["CollectionAsset"],
  },
};

export default meta;

export const Basic = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/collection/collection-basic.tsx"),
);
