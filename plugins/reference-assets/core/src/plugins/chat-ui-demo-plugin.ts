import { AsyncNodePlugin } from "@player-ui/async-node-plugin";
import {
  ExpressionContext,
  ExtendedPlayerPlugin,
  NodeType,
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
    let allPromiseKeys: string[] = [];
    let counter = 0;

    const sendMessage: send = (
      context: ExpressionContext,
      message: string,
      nodeId?: string,
    ): void => {
      if (nodeId && !(nodeId in deferredPromises)) {
        context.logger?.warn(
          `'send' expression called with unrecognized id '${nodeId}'`,
        );
        return;
      }

      if (!nodeId && allPromiseKeys.length === 0) {
        context.logger?.warn(`'send' called with no waiting async nodes`);
        return;
      }

      // Either resolve the node by the id or resolve all of them if no id provided
      const keys = nodeId ? [nodeId] : allPromiseKeys;

      for (const id of keys) {
        const content = createContentFromMessage(
          message,
          `message-${counter++}`,
        );
        const resolveFunction = deferredPromises[id];
        resolveFunction?.(content);
        delete deferredPromises[id];
      }

      if (nodeId) {
        const index = allPromiseKeys.indexOf(nodeId);
        allPromiseKeys.splice(index, 1);
      } else {
        allPromiseKeys = [];
      }
    };

    asyncNodePlugin.hooks.onAsyncNode.tap(this.name, (node) => {
      // Ensure this is only used on the chat-ui.tsx mock to prevent the promise from setting up during tests.
      if (
        node.parent?.parent?.type !== NodeType.Asset ||
        !node.parent.parent.value.id.startsWith("collection-async-chat-demo")
      ) {
        return Promise.resolve(undefined);
      }

      return new Promise((res) => {
        deferredPromises[node.id] = res;
        allPromiseKeys.push(node.id);
      });
    });

    // Reset at the start of a new view.
    player.hooks.view.tap(this.name, (_) => {
      deferredPromises = {};
      allPromiseKeys = [];
      counter = 0;
    });

    // Register 'send' expression
    const expressionPlugin = new ExpressionPlugin(
      new Map([["send", sendMessage]]),
    );
    player.registerPlugin(expressionPlugin);
  }
}
