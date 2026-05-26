import type { Asset } from "@player-ui/types";
import type { A2UISnapshot } from "@player-ui/a2ui-plugin";

/**
 * Structural shape of an AG-UI compatible agent. Mirrors the subset of
 * `@ag-ui/client`'s `AbstractAgent` we use so any conforming object — including
 * `HttpAgent`, `MastraAgent`, or our own `ScriptedAgent` — works without a hard
 * SDK dependency. Consumers typically pass an `AbstractAgent` instance directly.
 */
export interface AGUIAgent {
  /** Mutable conversation history. New user turns push onto this before `runAgent`. */
  messages: AGUIMessage[];
  /** Stable id for the conversation. Optional — surfaced into the session data model. */
  threadId?: string;
  /**
   * Subscribe to the agent's event stream. Returns an unsubscribe function.
   * Handlers are called once per event in arrival order.
   */
  subscribe(handlers: AGUIEventHandlers): AGUISubscription;
  /** Run the agent with the current message history + provided input. */
  runAgent(input?: Record<string, unknown>): Promise<unknown>;
}

export interface AGUISubscription {
  unsubscribe(): void;
}

export interface AGUIMessage {
  id: string;
  role: "user" | "assistant" | "tool" | "system";
  content?: string;
  /** Structured payload used when content is non-text (e.g., A2UI form submission). */
  data?: Record<string, unknown>;
}

/**
 * AG-UI event taxonomy. Names match `@ag-ui/core`'s `EventType` enum so events
 * produced by the official SDK route through `event.type` directly.
 */
export type AGUIEventType =
  | "RUN_STARTED"
  | "RUN_FINISHED"
  | "RUN_ERROR"
  | "STEP_STARTED"
  | "STEP_FINISHED"
  | "TEXT_MESSAGE_START"
  | "TEXT_MESSAGE_CONTENT"
  | "TEXT_MESSAGE_END"
  | "TEXT_MESSAGE_CHUNK"
  | "REASONING_START"
  | "REASONING_MESSAGE_START"
  | "REASONING_MESSAGE_CONTENT"
  | "REASONING_MESSAGE_END"
  | "REASONING_END"
  | "TOOL_CALL_START"
  | "TOOL_CALL_ARGS"
  | "TOOL_CALL_END"
  | "TOOL_CALL_RESULT"
  | "STATE_SNAPSHOT"
  | "STATE_DELTA"
  | "MESSAGES_SNAPSHOT"
  | "CUSTOM"
  | "RAW";

export interface AGUIBaseEvent {
  type: AGUIEventType;
  timestamp?: number;
  rawEvent?: unknown;
}

export interface AGUIRunStartedEvent extends AGUIBaseEvent {
  type: "RUN_STARTED";
  threadId?: string;
  runId?: string;
}

export interface AGUIRunFinishedEvent extends AGUIBaseEvent {
  type: "RUN_FINISHED";
  result?: unknown;
}

export interface AGUIRunErrorEvent extends AGUIBaseEvent {
  type: "RUN_ERROR";
  message?: string;
  code?: string;
}

export interface AGUITextMessageStartEvent extends AGUIBaseEvent {
  type: "TEXT_MESSAGE_START";
  messageId: string;
  role?: AGUIMessage["role"];
}

export interface AGUITextMessageContentEvent extends AGUIBaseEvent {
  type: "TEXT_MESSAGE_CONTENT";
  messageId: string;
  delta: string;
}

export interface AGUITextMessageEndEvent extends AGUIBaseEvent {
  type: "TEXT_MESSAGE_END";
  messageId: string;
}

export interface AGUIReasoningMessageStartEvent extends AGUIBaseEvent {
  type: "REASONING_MESSAGE_START";
  messageId: string;
}

export interface AGUIReasoningMessageContentEvent extends AGUIBaseEvent {
  type: "REASONING_MESSAGE_CONTENT";
  messageId: string;
  delta: string;
}

export interface AGUIReasoningMessageEndEvent extends AGUIBaseEvent {
  type: "REASONING_MESSAGE_END";
  messageId: string;
}

export interface AGUIToolCallStartEvent extends AGUIBaseEvent {
  type: "TOOL_CALL_START";
  toolCallId: string;
  toolCallName: string;
  parentMessageId?: string;
}

export interface AGUIToolCallArgsEvent extends AGUIBaseEvent {
  type: "TOOL_CALL_ARGS";
  toolCallId: string;
  delta: string;
}

export interface AGUIToolCallEndEvent extends AGUIBaseEvent {
  type: "TOOL_CALL_END";
  toolCallId: string;
}

export interface AGUIToolCallResultEvent extends AGUIBaseEvent {
  type: "TOOL_CALL_RESULT";
  toolCallId: string;
  messageId?: string;
  content?: unknown;
}

export interface AGUIStateSnapshotEvent extends AGUIBaseEvent {
  type: "STATE_SNAPSHOT";
  snapshot: Record<string, unknown>;
}

export interface AGUIStateDeltaEvent extends AGUIBaseEvent {
  type: "STATE_DELTA";
  /** RFC 6902 JSON patches against the current state. */
  delta: Array<{ op: string; path: string; value?: unknown }>;
}

/**
 * The carrier for A2UI snapshots. Per the off-the-shelf contract: the agent
 * emits `CustomEvent { name: "a2ui", value: <A2UISnapshot> }` whenever it wants
 * the UI to render an interactive surface.
 */
export interface AGUICustomEvent<T = unknown> extends AGUIBaseEvent {
  type: "CUSTOM";
  name: string;
  value: T;
}

export type AGUIEvent =
  | AGUIRunStartedEvent
  | AGUIRunFinishedEvent
  | AGUIRunErrorEvent
  | AGUITextMessageStartEvent
  | AGUITextMessageContentEvent
  | AGUITextMessageEndEvent
  | AGUIReasoningMessageStartEvent
  | AGUIReasoningMessageContentEvent
  | AGUIReasoningMessageEndEvent
  | AGUIToolCallStartEvent
  | AGUIToolCallArgsEvent
  | AGUIToolCallEndEvent
  | AGUIToolCallResultEvent
  | AGUIStateSnapshotEvent
  | AGUIStateDeltaEvent
  | AGUICustomEvent<A2UISnapshot>
  | AGUICustomEvent
  | AGUIBaseEvent;

/**
 * Per-event handler shape. Mirrors `@ag-ui/client`'s subscribe options so that
 * passing an `AbstractAgent` works out-of-the-box. All handlers are optional —
 * the session plugin only attaches the ones it needs.
 */
export interface AGUIEventHandlers {
  onEvent?(payload: { event: AGUIEvent }): void;
  onRunStartedEvent?(payload: { event: AGUIRunStartedEvent }): void;
  onRunFinishedEvent?(payload: { event: AGUIRunFinishedEvent }): void;
  onRunErrorEvent?(payload: { event: AGUIRunErrorEvent }): void;
  onTextMessageStartEvent?(payload: { event: AGUITextMessageStartEvent }): void;
  onTextMessageContentEvent?(payload: {
    event: AGUITextMessageContentEvent;
  }): void;
  onTextMessageEndEvent?(payload: { event: AGUITextMessageEndEvent }): void;
  onReasoningMessageStartEvent?(payload: {
    event: AGUIReasoningMessageStartEvent;
  }): void;
  onReasoningMessageContentEvent?(payload: {
    event: AGUIReasoningMessageContentEvent;
  }): void;
  onReasoningMessageEndEvent?(payload: {
    event: AGUIReasoningMessageEndEvent;
  }): void;
  onToolCallStartEvent?(payload: { event: AGUIToolCallStartEvent }): void;
  onToolCallArgsEvent?(payload: { event: AGUIToolCallArgsEvent }): void;
  onToolCallEndEvent?(payload: { event: AGUIToolCallEndEvent }): void;
  onToolCallResultEvent?(payload: { event: AGUIToolCallResultEvent }): void;
  onStateSnapshotEvent?(payload: { event: AGUIStateSnapshotEvent }): void;
  onStateDeltaEvent?(payload: { event: AGUIStateDeltaEvent }): void;
  onCustomEvent?(payload: { event: AGUICustomEvent }): void;
}

/**
 * Output of `event-router.route()`. Pure description of an intended side
 * effect; the mutation applier interprets these against the live Player.
 */
export type SessionMutation =
  | { kind: "appendTranscript"; asset: Asset }
  | { kind: "streamTextDelta"; messageId: string; delta: string }
  | { kind: "setSurface"; asset: Asset | null }
  | { kind: "setData"; path: string; value: unknown }
  | {
      kind: "applyStateDelta";
      patches: AGUIStateDeltaEvent["delta"];
    }
  | {
      kind: "setStatus";
      status: "idle" | "running" | "error";
      message?: string;
    };

/**
 * Slot ids used in the session flow. Centralized so the adapter, the async-node
 * tap, and the mutation applier agree on the contract.
 */
export const SESSION_FLOW_ID = "agui-session";
export const TRANSCRIPT_SEED_PREFIX = "agui-transcript-seed";
export const SURFACE_SEED_PREFIX = "agui-surface-seed";

export const AGUI_DATA_NAMESPACE = "agui";
export const AGUI_MESSAGES_PATH = `${AGUI_DATA_NAMESPACE}.messages`;
export const AGUI_STATE_PATH = `${AGUI_DATA_NAMESPACE}.state`;
export const AGUI_SURFACES_PATH = `${AGUI_DATA_NAMESPACE}.surfaces`;
export const AGUI_IS_RUNNING_PATH = `${AGUI_DATA_NAMESPACE}.isRunning`;
export const AGUI_RUN_ID_PATH = `${AGUI_DATA_NAMESPACE}.runId`;
export const AGUI_THREAD_ID_PATH = `${AGUI_DATA_NAMESPACE}.threadId`;
export const AGUI_ERROR_PATH = `${AGUI_DATA_NAMESPACE}.error`;
export const AGUI_INPUT_VALUE_PATH = `${AGUI_DATA_NAMESPACE}.inputValue`;
