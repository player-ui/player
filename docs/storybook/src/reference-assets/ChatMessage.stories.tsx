import { createDSLStory } from "@player-ui/storybook";
import { Meta } from "@storybook/react";

const meta: Meta = {
  title: "Reference Assets/ChatMessage",
};

export default meta;

export const Basic = createDSLStory(
  () =>
    import(
      "!!raw-loader!@player-ui/mocks/chat-message/chat-message-basic.tsx"
    ),
);
