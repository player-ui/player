import type { Asset } from "@player-ui/types";
import type { Logger } from "@player-ui/player";
import type { A2UISnapshot } from "@player-ui/a2ui-plugin";
import { embedA2UISnapshot } from "./a2ui-bridge";
import {
  AGUI_ERROR_PATH,
  AGUI_MESSAGES_PATH,
  AGUI_RUN_ID_PATH,
  AGUI_STATE_PATH,
  type AGUIEvent,
  type SessionMutation,
} from "./types";

export interface RouterContext {
  logger?: Logger;
  /**
   * Tracker for which assistant message ids have produced a transcript bubble
   * yet. Read-only from the router's perspective; the caller manages the set
   * across calls so duplicate `TEXT_MESSAGE_START` events are tolerated.
   */
  startedMessageIds: Set<string>;
  /** Same idea for tool calls. */
  startedToolCallIds: Set<string>;
}

const A2UI_CUSTOM_EVENT_NAME = "a2ui";

function textBubbleAsset(messageId: string, role: string | undefined): Asset {
  return {
    id: `agui-message-${messageId}`,
    type: "agui-text-message",
    messageId,
    role: role ?? "assistant",
    value: `{{${AGUI_MESSAGES_PATH}.${messageId}.content}}`,
  } as Asset;
}

function reasoningBubbleAsset(messageId: string): Asset {
  return {
    id: `agui-reasoning-${messageId}`,
    type: "agui-reasoning",
    messageId,
    value: `{{${AGUI_MESSAGES_PATH}.${messageId}.content}}`,
  } as Asset;
}

function toolCallCardAsset(toolCallId: string, toolCallName: string): Asset {
  // `args` is streamed via `streamTextDelta` which lands at
  // `<base>.content` — read from that exact path so the resolved value is a
  // string, not the wrapper object.
  return {
    id: `agui-tool-${toolCallId}`,
    type: "agui-tool-call",
    toolCallId,
    toolCallName,
    args: `{{${AGUI_MESSAGES_PATH}.${toolCallId}.args.content}}`,
    result: `{{${AGUI_MESSAGES_PATH}.${toolCallId}.result}}`,
  } as Asset;
}

/**
 * Pure mapping from one AG-UI event to the side effects it should cause.
 * No external state is read or written here — all decisions come from `event`
 * and `ctx`. The applier handles the actual Player interactions.
 *
 * Unknown / unsupported event types fall through to `[]` (no-op). Returning
 * an empty array is intentional: AG-UI is permissive about new event types
 * and the protocol explicitly allows pass-through.
 */
export function route(event: AGUIEvent, ctx: RouterContext): SessionMutation[] {
  switch (event.type) {
    case "RUN_STARTED": {
      const mutations: SessionMutation[] = [
        { kind: "setStatus", status: "running" },
        { kind: "setData", path: AGUI_ERROR_PATH, value: null },
      ];
      if ("runId" in event && typeof event.runId === "string") {
        mutations.push({
          kind: "setData",
          path: AGUI_RUN_ID_PATH,
          value: event.runId,
        });
      }
      return mutations;
    }

    case "RUN_FINISHED": {
      return [{ kind: "setStatus", status: "idle" }];
    }

    case "RUN_ERROR": {
      const e = event as { message?: string };
      return [
        { kind: "setStatus", status: "error", message: e.message },
        { kind: "setData", path: AGUI_ERROR_PATH, value: e.message ?? "error" },
      ];
    }

    case "TEXT_MESSAGE_START": {
      const e = event as { messageId: string; role?: string };
      if (ctx.startedMessageIds.has(e.messageId)) return [];
      ctx.startedMessageIds.add(e.messageId);
      return [
        {
          kind: "setData",
          path: `${AGUI_MESSAGES_PATH}.${e.messageId}.content`,
          value: "",
        },
        {
          kind: "appendTranscript",
          asset: textBubbleAsset(e.messageId, e.role),
        },
      ];
    }

    case "TEXT_MESSAGE_CONTENT": {
      const e = event as { messageId: string; delta: string };
      return [
        { kind: "streamTextDelta", messageId: e.messageId, delta: e.delta },
      ];
    }

    case "TEXT_MESSAGE_END":
      return [];

    case "REASONING_MESSAGE_START": {
      const e = event as { messageId: string };
      if (ctx.startedMessageIds.has(e.messageId)) return [];
      ctx.startedMessageIds.add(e.messageId);
      return [
        {
          kind: "setData",
          path: `${AGUI_MESSAGES_PATH}.${e.messageId}.content`,
          value: "",
        },
        { kind: "appendTranscript", asset: reasoningBubbleAsset(e.messageId) },
      ];
    }

    case "REASONING_MESSAGE_CONTENT": {
      const e = event as { messageId: string; delta: string };
      return [
        { kind: "streamTextDelta", messageId: e.messageId, delta: e.delta },
      ];
    }

    case "TOOL_CALL_START": {
      const e = event as { toolCallId: string; toolCallName: string };
      if (ctx.startedToolCallIds.has(e.toolCallId)) return [];
      ctx.startedToolCallIds.add(e.toolCallId);
      // Seed `args.content` as an empty string so subsequent `streamTextDelta`
      // append calls land at the same path the asset binding reads from.
      return [
        {
          kind: "setData",
          path: `${AGUI_MESSAGES_PATH}.${e.toolCallId}.args.content`,
          value: "",
        },
        {
          kind: "appendTranscript",
          asset: toolCallCardAsset(e.toolCallId, e.toolCallName),
        },
      ];
    }

    case "TOOL_CALL_ARGS": {
      const e = event as { toolCallId: string; delta: string };
      return [
        {
          kind: "streamTextDelta",
          messageId: `${e.toolCallId}.args`,
          delta: e.delta,
        },
      ];
    }

    case "TOOL_CALL_RESULT": {
      const e = event as { toolCallId: string; content?: unknown };
      return [
        {
          kind: "setData",
          path: `${AGUI_MESSAGES_PATH}.${e.toolCallId}.result`,
          value: e.content ?? null,
        },
      ];
    }

    case "TOOL_CALL_END":
      return [];

    case "STATE_SNAPSHOT": {
      const e = event as { snapshot: Record<string, unknown> };
      return [{ kind: "setData", path: AGUI_STATE_PATH, value: e.snapshot }];
    }

    case "STATE_DELTA": {
      const e = event as {
        delta: Array<{ op: string; path: string; value?: unknown }>;
      };
      return [{ kind: "applyStateDelta", patches: e.delta }];
    }

    case "CUSTOM": {
      const e = event as { name: string; value: unknown };
      if (e.name === A2UI_CUSTOM_EVENT_NAME) {
        try {
          const asset = embedA2UISnapshot(e.value as A2UISnapshot, ctx.logger);
          return [{ kind: "setSurface", asset }];
        } catch (err) {
          ctx.logger?.error?.(
            "[ag-ui] Failed to embed A2UI snapshot from CustomEvent:",
            err,
          );
          return [
            {
              kind: "setStatus",
              status: "error",
              message: (err as Error).message,
            },
          ];
        }
      }
      return [];
    }

    default:
      return [];
  }
}

/**
 * Convenience factory so callers can produce a fresh router context per
 * subscription without inlining the field shape.
 */
export function createRouterContext(logger?: Logger): RouterContext {
  return {
    logger,
    startedMessageIds: new Set(),
    startedToolCallIds: new Set(),
  };
}
