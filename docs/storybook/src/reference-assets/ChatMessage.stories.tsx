import type { Meta } from "@storybook/react";
import { createDSLStory, PlayerStory } from "@player-ui/storybook";
import { ChatMessage } from "@player-ui/reference-assets-plugin-react";

const meta: Meta<typeof ChatMessage> = {
  title: "Reference Assets/ChatMessage",
  component: ChatMessage,
};

export default meta;

export const Basic = () => (
  <PlayerStory
    flow={() => import("@player-ui/mocks/chat-message/chat-message-basic.json")}
  />
);

export const BasicWithoutCollection = () => (
  <PlayerStory
    flow={() => import("@player-ui/mocks/chat-message/chat-message-no-collection.json")}
  />
);


export const Expression = createDSLStory(
  () => import("!!raw-loader!@player-ui/mocks/chat-message/chat-message.tsx"),
);
