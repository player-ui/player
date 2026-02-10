import { Meta } from "@storybook/react-vite";
import { createDSLStory } from "@player-ui/storybook";

const meta: Meta = {
  title: "Reference Assets/ChatMessage",
};

export default meta;

export const ChatUI = createDSLStory(
  () => import("@player-ui/mocks/chat-message/chat-ui.tsx?raw"),
);
