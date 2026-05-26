import type { Asset } from "@player-ui/types";
import type { Player, PlayerPlugin } from "@player-ui/player";
import { AsyncNodePlugin } from "@player-ui/async-node-plugin";
import {
  applyMutation,
  createApplierState,
  flushPendingTranscript,
  type SessionApplierState,
} from "../session/mutation-applier";
import { createRouterContext, route } from "../session/event-router";
import {
  AGUI_MESSAGES_PATH,
  SURFACE_SEED_PREFIX,
  TRANSCRIPT_SEED_PREFIX,
  type AGUIAgent,
  type AGUIEvent,
  type AGUIMessage,
  type AGUISubscription,
} from "../session/types";

/**
 * Live wiring between the agent and the session flow.
 *
 *  1. Finds the `AsyncNodePlugin` registered alongside us and taps its
 *     `onAsyncNode` hook. When the resolver hits a transcript or surface
 *     seed, we park the `callback` arg so the mutation applier can re-invoke
 *     it for every subsequent event (this is how text bubbles and A2UI
 *     surfaces materialize without rebuilding the flow).
 *
 *  2. On the first `view`, subscribes to the agent's event stream. Each event
 *     is routed through the pure `route()` function → list of mutations →
 *     `applyMutation` writes to the live DataController / async-node
 *     callbacks. Subscription is reset between views (`hooks.view`) and torn
 *     down on flow end (`hooks.onEnd`).
 */
export class AGUISessionPlugin implements PlayerPlugin {
  name = "ag-ui-session";

  private state: SessionApplierState = createApplierState();
  private subscription: AGUISubscription | null = null;
  private dataController: {
    set: (transaction: Record<string, unknown>) => unknown;
    get: (binding: string) => unknown;
  } | null = null;

  constructor(private readonly opts: { agent: AGUIAgent }) {}

  apply(player: Player): void {
    const asyncNodePlugin = player.findPlugin<AsyncNodePlugin>(
      AsyncNodePlugin.Symbol,
    );
    if (!asyncNodePlugin) {
      player.logger.warn(
        `[ag-ui-session] AsyncNodePlugin not found — session streaming disabled.`,
      );
      return;
    }

    asyncNodePlugin.hooks.onAsyncNode.tap(this.name, (node, callback) => {
      if (node.id.startsWith(TRANSCRIPT_SEED_PREFIX)) {
        // Each chained seed parks its own callback here; flush flushes any
        // assets that arrived before this seed was reached.
        this.state.transcript.callback = callback;
        flushPendingTranscript(this.state);
        return new Promise((resolve) => {
          this.state.transcript.resolver = resolve;
        });
      }
      if (node.id.startsWith(SURFACE_SEED_PREFIX)) {
        this.state.surface.callback = callback;
        if (this.state.surface.asset) {
          // Single-asset slot — Player wraps in `{ asset: ... }` itself.
          callback(this.state.surface.asset);
        }
        return new Promise((resolve) => {
          this.state.surface.resolver = resolve;
        });
      }
      return Promise.resolve(undefined);
    });

    player.hooks.dataController.tap(this.name, (dataController) => {
      this.dataController = {
        set: (tx) => dataController.set(tx),
        get: (binding) => dataController.get(binding),
      };
    });

    player.hooks.viewController.tap(this.name, (viewController) => {
      viewController.hooks.view.tap(this.name, () => {
        this.attachSubscriptionOnce(player);
      });
    });

    player.hooks.onEnd.tap(this.name, () => {
      this.teardown();
    });
  }

  private attachSubscriptionOnce(player: Player): void {
    if (this.subscription) return;
    const routerCtx = createRouterContext(player.logger);
    const dispatch = (event: AGUIEvent) => {
      const mutations = route(event, routerCtx);
      for (const m of mutations) {
        applyMutation(m, {
          state: this.state,
          logger: player.logger,
          setData: (path, value) => this.dataController?.set({ [path]: value }),
          getData: (path) => this.dataController?.get(path),
        });
      }
    };

    this.subscription = this.opts.agent.subscribe({
      onEvent: ({ event }) => dispatch(event as AGUIEvent),
    });
  }

  private teardown(): void {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.state.transcript.resolver?.(undefined);
    this.state.surface.resolver?.(undefined);
    this.state = createApplierState();
  }

  /**
   * Render a user-authored message in the transcript. Called by the
   * expressions plugin (`agui_send` / `agui_submitSurface`) immediately after
   * pushing onto `agent.messages` — AG-UI agents don't echo user turns
   * through events, so the UI has to record the bubble locally.
   */
  public pushUserMessage(message: AGUIMessage): void {
    const bubble = userBubbleAsset(message);
    this.state.transcript.assets.push(bubble);
    this.dataController?.set({
      [`${AGUI_MESSAGES_PATH}.${message.id}.content`]: message.content ?? "",
    });
    flushPendingTranscript(this.state);
  }
}

function userBubbleAsset(message: AGUIMessage): Asset {
  return {
    id: `agui-message-${message.id}`,
    type: "agui-text-message",
    messageId: message.id,
    role: message.role,
    value: `{{${AGUI_MESSAGES_PATH}.${message.id}.content}}`,
  } as Asset;
}
