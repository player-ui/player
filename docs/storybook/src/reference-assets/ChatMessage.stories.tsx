import type { Meta } from "@storybook/react";
import { PlayerStory } from "@player-ui/storybook";
import { ChatMessageWrapper } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof ChatMessageWrapper> = {
  title: "Reference Assets/ChatMessage",
  component: ChatMessageWrapper,
};

export default meta;

export const Basic = () => (
  <PlayerStory
    flow={() => import("@player-ui/mocks/chat-message/chat-message-basic.json")}
  />
);

