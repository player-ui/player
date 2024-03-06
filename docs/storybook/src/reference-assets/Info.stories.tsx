import type { Meta } from "@storybook/react";
import { createDSLStory } from "@player-ui/storybook-addon-player";
import { Info } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Info> = {
  title: "Reference Assets/Info",
  component: Info,
};

export default meta;

export const Basic = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/reference-assets-plugin-mocks/info/info-basic.tsx"
    ),
);

export const DynamicFlow = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/reference-assets-plugin-mocks/info/info-dynamic-flow.tsx"
    ),
);

export const Footer = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/reference-assets-plugin-mocks/info/info-footer.tsx"
    ),
);

export const ModalFlow = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/reference-assets-plugin-mocks/info/info-modal-flow.tsx"
    ),
);
