import { Meta } from "@storybook/react";
import { createDSLStory } from "@player-ui/storybook";

const meta: Meta = {
  title: "Reference Assets/ChatMessage",
};

export default meta;

export const ChatUI = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/chat-message/chat-ui.tsx"),
);
