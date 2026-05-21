import type { Player, PlayerPlugin } from "@player-ui/player";
import { ContextPlugin } from "./plugin";
import { defineContextKey } from "./key";
import { getContextPlugin } from "./utils";
import type { ContextKey } from "./types";

/** Identifier of the currently-running flow. */
export const flowIdContextKey: ContextKey<string> = defineContextKey<string>(
  "player.flow.id",
  "Identifier of the running flow",
);

/** Name of the current FSM state within the running flow. */
export const flowStateContextKey: ContextKey<string> = defineContextKey<string>(
  "player.flow.state",
  "Name of the current FSM state in the running flow",
);

/** Identifier of the view currently resolved by the ViewController. */
export const viewIdContextKey: ContextKey<string> = defineContextKey<string>(
  "player.view.id",
  "Identifier of the currently-resolved view",
);

/** Full resolved view object for the current FSM state. */
export const viewContextKey: ContextKey<unknown> = defineContextKey<unknown>(
  "player.view",
  "Full resolved view object for the current FSM state",
);

/** Full data model tree for the running flow. */
export const dataContextKey: ContextKey<unknown> = defineContextKey<unknown>(
  "player.data",
  "Full data model tree for the running flow",
);

/** Player flow status: not-started, in-progress, completed, or error. */
export const playerStatusContextKey: ContextKey<string> =
  defineContextKey<string>(
    "player.status",
    "Player flow status: not-started, in-progress, completed, or error",
  );

/** Aggregated snapshot composed from every other StateContextPlugin key. */
export type PlayerStateContext = {
  status?: string;
  flow: {
    id?: string;
    state?: string;
  };
  view: {
    id?: string;
    resolved?: unknown;
  };
  data?: unknown;
};

/**
 * Single roll-up key that aggregates every other [[StateContextPlugin]] entry
 * into one object. Backed by a transform — reading recomputes from the latest
 * source values, and subscribers fire whenever any source updates.
 */
export const playerStateContextKey: ContextKey<PlayerStateContext> =
  defineContextKey<PlayerStateContext>(
    "player.state",
    "Aggregated snapshot of every Player runtime context entry",
  );

/**
 * A consumer plugin that mirrors Player runtime state into the ContextPlugin
 * store. Registers a small, opinionated set of context entries (flow id,
 * current FSM state, view id, full view, data model, status) so external
 * automation/devtools can observe the running Player without tapping every
 * controller hook themselves.
 *
 * Auto-registers a [[ContextPlugin]] if one isn't already on the player.
 */
export class StateContextPlugin implements PlayerPlugin {
  name = "state-context";

  private contextPlugin?: ContextPlugin;

  apply(player: Player) {
    const ctx = getContextPlugin(player);
    this.contextPlugin = ctx;

    ctx.register(flowIdContextKey);
    ctx.register(flowStateContextKey);
    ctx.register(viewIdContextKey);
    ctx.register(viewContextKey);
    ctx.register(dataContextKey);
    ctx.register(playerStatusContextKey);

    ctx.registerTransform(playerStateContextKey, {
      sources: [
        flowIdContextKey,
        flowStateContextKey,
        viewIdContextKey,
        viewContextKey,
        dataContextKey,
        playerStatusContextKey,
      ],
      compute: (read) => ({
        status: read(playerStatusContextKey),
        flow: {
          id: read(flowIdContextKey),
          state: read(flowStateContextKey),
        },
        view: {
          id: read(viewIdContextKey),
          resolved: read(viewContextKey),
        },
        data: read(dataContextKey),
      }),
    });

    player.hooks.onStart.tap(this.name, (flow) => {
      if (flow?.id) {
        ctx.set(flowIdContextKey, flow.id);
      }
    });

    player.hooks.state.tap(this.name, (state) => {
      ctx.set(playerStatusContextKey, state.status);
    });

    player.hooks.flowController.tap(this.name, (flowController) => {
      flowController.hooks.flow.tap(this.name, (flowInstance) => {
        const recordState = () => {
          const name = flowInstance.currentState?.name;
          if (name) {
            ctx.set(flowStateContextKey, name);
          }
        };
        recordState();
        flowInstance.hooks.afterTransition.tap(this.name, recordState);
      });
    });

    player.hooks.viewController.tap(this.name, (viewController) => {
      viewController.hooks.view.tap(this.name, (view) => {
        const id = view.initialView?.id;
        if (id) {
          ctx.set(viewIdContextKey, id);
        }
        view.hooks.onUpdate.tap(this.name, (resolved) => {
          ctx.set(viewContextKey, resolved);
          if (resolved?.id) {
            ctx.set(viewIdContextKey, resolved.id);
          }
        });
      });
    });

    player.hooks.dataController.tap(this.name, (dataController) => {
      const publish = () => {
        ctx.set(dataContextKey, dataController.serialize());
      };
      dataController.hooks.onUpdate.tap(this.name, publish);
      publish();
    });
  }
}
