import type {
  ExpressionContext,
  ExpressionHandler,
  Player,
  PlayerPlugin,
} from "@player-ui/player";
import { ExpressionPlugin } from "@player-ui/expression-plugin";
import {
  AGUI_INPUT_VALUE_PATH,
  AGUI_SURFACES_PATH,
  type AGUIAgent,
  type AGUIMessage,
} from "../session/types";

export interface AGUIExpressionsPluginOptions {
  agent: AGUIAgent;
  /**
   * Invoked after a user-authored message is pushed onto `agent.messages` so
   * the UI can render the bubble locally. AG-UI agents typically don't echo
   * user turns through events — the spec leaves user-message UI rendering to
   * the client.
   */
  onUserMessage?(message: AGUIMessage): void;
}

/**
 * Registers the expressions content uses to drive an AG-UI agent:
 *
 *  - `agui_send(text?)`  — append a user message with the given text (or the
 *    current input-bar value if omitted) and start a new run.
 *  - `agui_submitSurface(name, data?)` — A2UI form action target. The form's
 *    `action.event.name` and collected context become a structured user
 *    message that starts a new run.
 *  - `agui_cancel()` — best-effort: if the agent exposes `cancel()`, call it.
 *
 * Names use underscore separators so Player's expression parser (which uses
 * dots for member access) doesn't tokenize them as property paths.
 */
export class AGUIExpressionsPlugin implements PlayerPlugin {
  name = "ag-ui-expressions";

  constructor(private readonly opts: AGUIExpressionsPluginOptions) {}

  apply(player: Player): void {
    const { agent, onUserMessage } = this.opts;

    const newId = (): string =>
      `msg-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const send: ExpressionHandler<[string?], void> = (
      ctx: ExpressionContext,
      text?: string,
    ): void => {
      const resolved =
        typeof text === "string" && text.length > 0
          ? text
          : ((ctx.model.get(AGUI_INPUT_VALUE_PATH) as string | undefined) ??
            "");
      if (!resolved) return;
      const message: AGUIMessage = {
        id: newId(),
        role: "user",
        content: resolved,
      };
      agent.messages.push(message);
      ctx.model.set([[AGUI_INPUT_VALUE_PATH, ""]]);
      onUserMessage?.(message);
      void agent.runAgent({});
    };

    const submitSurface: ExpressionHandler<[string, string?], void> = (
      ctx: ExpressionContext,
      name: string,
      bubbleId?: string,
    ): void => {
      // The A2UI bridge calls this from a button's `exp` after the button's
      // context-writes have already landed at `agent.event.context.*`. Read
      // them back as the structured payload.
      const fromModel = ctx.model.get("agent.event.context") as
        | Record<string, unknown>
        | undefined;
      const resolvedData = fromModel ?? {};
      const summary =
        Object.keys(resolvedData).length > 0
          ? `${name}: ${JSON.stringify(resolvedData)}`
          : name;
      const message: AGUIMessage = {
        id: newId(),
        role: "user",
        content: summary,
        data: resolvedData,
      };
      agent.messages.push(message);
      if (bubbleId) {
        // The submit happened on a transcript-embedded A2UI surface — flip
        // its in-place state so the form swaps to a summary bubble. Don't
        // also push a separate user bubble; the surface bubble IS the user's
        // turn now.
        ctx.model.set([
          [`${AGUI_SURFACES_PATH}.${bubbleId}.submitted`, true],
          [`${AGUI_SURFACES_PATH}.${bubbleId}.summary`, summary],
        ]);
      } else {
        // Programmatic submit (no bubble) — push a user bubble like agui_send.
        onUserMessage?.(message);
      }
      void agent.runAgent({});
    };

    const cancel: ExpressionHandler<[], void> = (
      _ctx: ExpressionContext,
    ): void => {
      const maybe = agent as unknown as { cancel?: () => void };
      maybe.cancel?.();
    };

    player.registerPlugin(
      new ExpressionPlugin(
        new Map<string, ExpressionHandler<unknown[], unknown>>([
          ["agui_send", send as ExpressionHandler<unknown[], unknown>],
          [
            "agui_submitSurface",
            submitSurface as ExpressionHandler<unknown[], unknown>,
          ],
          ["agui_cancel", cancel as ExpressionHandler<unknown[], unknown>],
        ]),
      ),
    );
  }
}
