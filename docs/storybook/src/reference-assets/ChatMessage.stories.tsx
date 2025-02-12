import { PlayerStory } from "@player-ui/storybook";
import { Meta } from "@storybook/react";

const meta: Meta = {
  title: "Reference Assets/ChatMessage",
};

export default meta;

export const Basic = () => (
  <PlayerStory
    flow={() => import("@player-ui/mocks/chat-message/chat-message-basic.json")}
  />
);
