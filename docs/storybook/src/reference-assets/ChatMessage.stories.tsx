import { createDSLStory } from "@player-ui/storybook";
import { Meta } from "@storybook/react";

const meta: Meta = {
  title: "Reference Assets/ChatMessage",
};

export default meta;

export const Basic = createDSLStory(
  () =>
    import(
      "@player-ui/mocks/chat-message/chat-message-basic.tsx?raw"
    ),
);
