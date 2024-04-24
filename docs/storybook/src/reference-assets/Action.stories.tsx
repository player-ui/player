import type { Meta } from "@storybook/react";
import { createDSLStory } from "@player-ui/storybook-addon-player";
import { Action } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof Action> = {
  title: "Reference Assets/Action",
  component: Action,
};

export default meta;

export const Basic = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/reference-assets-plugin-mocks/action/action-basic.tsx"
    ),
);

export const Expression = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/reference-assets-plugin-mocks/action/action-counter.tsx"
    ),
);

export const Navigation = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/reference-assets-plugin-mocks/action/action-navigation.tsx"
    ),
);

export const TransitionToEnd = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/reference-assets-plugin-mocks/action/action-transition-to-end.tsx"
    ),
);
