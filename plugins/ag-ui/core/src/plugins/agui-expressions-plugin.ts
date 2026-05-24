import type {
  ExpressionContext,
  ExpressionHandler,
  Player,
  PlayerPlugin,
} from "@player-ui/player";
import { ExpressionPlugin } from "@player-ui/expression-plugin";
import {
  AGUI_INPUT_VALUE_PATH,
  type AGUIAgent,
  type AGUIMessage,
} from "../session/types";

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

  constructor(private readonly opts: { agent: AGUIAgent }) {}

  apply(player: Player): void {
    const { agent } = this.opts;

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
      void agent.runAgent({});
    };

    const submitSurface: ExpressionHandler<
      [string, Record<string, unknown>?],
      void
    > = (
      _ctx: ExpressionContext,
      name: string,
      data?: Record<string, unknown>,
    ): void => {
      const message: AGUIMessage = {
        id: newId(),
        role: "user",
        content: name,
        data: data ?? {},
      };
      agent.messages.push(message);
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
