import { AsyncNodePlugin } from "@player-ui/async-node-plugin";
import {
  ExpressionContext,
  ExtendedPlayerPlugin,
  Player,
} from "@player-ui/player";
import { ExpressionPlugin } from "@player-ui/expression-plugin";
import { send } from "./send";

const createContentFromMessage = (message: string, id: string): any => ({
  asset: {
    type: "chat-message",
    id,
    value: {
      asset: {
        type: "text",
        id: `${id}-value`,
        value: message,
      },
    },
  },
});

export class ChatUiDemoPlugin implements ExtendedPlayerPlugin<[], [], [send]> {
  public readonly name = "chat-ui-demo-plugin";

  public apply(player: Player): void {
    const asyncNodePlugin = player.findPlugin<AsyncNodePlugin>(
      AsyncNodePlugin.Symbol,
    );

    if (!asyncNodePlugin) {
      player.logger.warn(
        `Failed to apply '${this.name}'. Reason: Could not find AsyncNodePlugin.`,
      );
      return;
    }

    let deferredPromises: Record<string, (val: string) => void> = {};
    let lastPromiseKey: string | undefined;
    let counter = 0;

    const sendMessage: send = (
      context: ExpressionContext,
      message: string,
      nodeId?: string,
    ): void => {
      const content = createContentFromMessage(message, `message-${counter++}`);
      const id = nodeId ?? lastPromiseKey;

      if (!id || !(id in deferredPromises)) {
        context.logger?.warn(
          "Could not send message because there are no async nodes.",
        );
        return;
      }

      const resolveFunction = deferredPromises[id];
      resolveFunction?.(content);
      delete deferredPromises[id];
    };

    asyncNodePlugin.hooks.onAsyncNode.tap(this.name, (node) => {
      return new Promise((res) => {
        deferredPromises[node.id] = res;
        lastPromiseKey = node.id;
      });
    });

    // Reset at the start of a new view.
    player.hooks.view.tap(this.name, (_) => {
      deferredPromises = {};
      lastPromiseKey = undefined;
      counter = 0;
    });

    // Register 'send' expression
    const expressionPlugin = new ExpressionPlugin(
      new Map([["send", sendMessage]]),
    );
    player.registerPlugin(expressionPlugin);
  }
}
