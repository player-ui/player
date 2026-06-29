import type { Player, PlayerPlugin } from "@player-ui/player";
import { defineContextKey } from "./key";
import { getContextPlugin } from "./utils";
import type { ContextKey } from "./types";

/** Set a single binding in the Player data model. */
export type SetDataAction = (binding: string, value: unknown) => void;

/** Transition the running flow using the given transition value. */
export type TransitionAction = (transition: string) => void;

/** A single validation, projected to its serializable fields. */
export type ContextValidation = {
  severity: "error" | "warning";
  message: string;
  displayTarget?: "page" | "section" | "field";
  blocking?: boolean | "once";
};

/** Validation state for the running view, keyed by binding. */
export type ValidationContext = {
  /** Whether the view has no blocking validations (derived, no side effects). */
  canTransition: boolean;
  /** Active validations per binding string. */
  byBinding: Record<string, ReadonlyArray<ContextValidation>>;
};

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

/** Validation state for the running view, keyed by binding. */
export const validationContextKey: ContextKey<ValidationContext> =
  defineContextKey<ValidationContext>(
    "player.validation",
    "Validation state for the running view, keyed by binding",
  );

/**
 * Action entry whose value is a callable that sets a binding in the data
 * model. Read via `ctx.get(setDataActionKey)`; absent until a flow is running.
 */
export const setDataActionKey: ContextKey<SetDataAction> =
  defineContextKey<SetDataAction>(
    "player.data.set",
    "Set a value in the Player data model at the given binding",
  );

/**
 * Action entry whose value is a callable that transitions the running flow.
 * Read via `ctx.get(transitionActionKey)`; absent until a flow is running.
 */
export const transitionActionKey: ContextKey<TransitionAction> =
  defineContextKey<TransitionAction>(
    "player.flow.transition",
    "Transition the current flow using the given transition value",
  );

/**
 * Aggregated snapshot composed from every other StateContextPlugin key.
 *
 * Actions are scoped to the construct they operate on — `transition` lives
 * under `flow`, `set` under `data` — rather than in a flat actions bag. Each
 * is bound to the live controller and is absent until a flow is in-progress.
 */
export type PlayerStateContext = {
  status?: string;
  flow: {
    id?: string;
    state?: string;
    /** Transition the running flow (e.g. 'Next'). */
    transition?: TransitionAction;
  };
  view: {
    id?: string;
    resolved?: unknown;
  };
  data: {
    /** Full data model tree for the running flow. */
    model?: unknown;
    /** Set a value in the data model at the given binding. */
    set?: SetDataAction;
  };
  /** Validation state for the running view, keyed by binding. */
  validation: ValidationContext;
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

  apply(player: Player) {
    const ctx = getContextPlugin(player);

    // The validation controller for the running flow, captured so data/view
    // updates can re-publish a passive (side-effect-free) validation snapshot.
    type ValidationControllerLike = Parameters<
      Parameters<typeof player.hooks.validationController.tap>[1]
    >[0];
    let validationController: ValidationControllerLike | undefined;

    const publishValidation = () => {
      if (!validationController) return;
      const byBinding: Record<string, ReadonlyArray<ContextValidation>> = {};
      let canTransition = true;
      validationController.getBindings().forEach((binding) => {
        const all = (validationController!
          .getValidationForBinding(binding)
          ?.getAll() ?? []) as ReadonlyArray<ContextValidation>;
        if (all.length === 0) return;
        byBinding[binding.asString()] = all.map((v) => ({
          severity: v.severity,
          message: v.message,
          displayTarget: v.displayTarget,
          blocking: v.blocking,
        }));
        if (all.some((v) => v.blocking)) {
          canTransition = false;
        }
      });
      ctx.set(validationContextKey, { canTransition, byBinding });
    };

    ctx.register(flowIdContextKey);
    ctx.register(flowStateContextKey);
    ctx.register(viewIdContextKey);
    ctx.register(viewContextKey);
    ctx.register(dataContextKey);
    ctx.register(playerStatusContextKey);
    ctx.register(validationContextKey);
    ctx.register(setDataActionKey);
    ctx.register(transitionActionKey);

    ctx.registerTransform(playerStateContextKey, {
      sources: [
        flowIdContextKey,
        flowStateContextKey,
        viewIdContextKey,
        viewContextKey,
        dataContextKey,
        playerStatusContextKey,
        validationContextKey,
        setDataActionKey,
        transitionActionKey,
      ],
      compute: (read) => ({
        status: read(playerStatusContextKey),
        flow: {
          id: read(flowIdContextKey),
          state: read(flowStateContextKey),
          transition: read(transitionActionKey),
        },
        view: {
          id: read(viewIdContextKey),
          resolved: read(viewContextKey),
        },
        data: {
          model: read(dataContextKey),
          set: read(setDataActionKey),
        },
        validation: read(validationContextKey) ?? {
          canTransition: true,
          byBinding: {},
        },
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
      // Bind to the concrete controller instance for the running flow.
      const transition: TransitionAction = (value) =>
        flowController.transition(value);
      ctx.set(transitionActionKey, transition);

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

    player.hooks.validationController.tap(this.name, (vc) => {
      validationController = vc;
      publishValidation();
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
          // Validation resets per view; re-publish for the resolved view.
          publishValidation();
        });
      });
    });

    player.hooks.dataController.tap(this.name, (dataController) => {
      // Bind the set-data action to this concrete controller instance.
      const setData: SetDataAction = (binding, value) => {
        dataController.set([[binding, value]]);
      };
      ctx.set(setDataActionKey, setData);

      const publish = () => {
        ctx.set(dataContextKey, dataController.serialize());
        // Validation re-evaluates on data change.
        publishValidation();
      };
      dataController.hooks.onUpdate.tap(this.name, publish);
      publish();
    });
  }
}
