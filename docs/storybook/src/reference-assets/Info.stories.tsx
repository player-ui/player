import type { Meta } from "@storybook/react-vite";
import { createDSLStory } from "@player-ui/storybook";
import { Info } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Info> = {
  title: "Reference Assets/Info",
  component: Info,
  parameters: {
    assetDocs: ["InfoAsset"],
  },
};

export default meta;

export const Basic = createDSLStory(
  () => import("@player-ui/mocks/info/info-basic.tsx?raw"),
);

export const DynamicFlow = createDSLStory(
  () => import("@player-ui/mocks/info/info-dynamic-flow.tsx?raw"),
);

export const Footer = createDSLStory(
  () => import("@player-ui/mocks/info/info-footer.tsx?raw"),
);

export const ModalFlow = createDSLStory(
  () => import("@player-ui/mocks/info/info-modal-flow.tsx?raw"),
);
