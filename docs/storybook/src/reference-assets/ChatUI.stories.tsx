import { Meta } from "@storybook/react-webpack5";
import { createDSLStory } from "@player-ui/storybook";

const meta: Meta = {
  title: "Reference Assets/ChatMessage",
};

export default meta;

export const ChatUI = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/chat-message/chat-ui.tsx"),
);
