/**
 * A2UI v0.9 message + component types and the snapshot shape accepted by Player.
 *
 * Only what the adapter consumes is modelled here — full protocol coverage
 * (streaming envelopes, deleteSurface, error responses) is out of scope for v1.
 */

export type JsonPointer = string;

export type A2UIPathRef = {
  path: JsonPointer;
};

export type A2UIFunctionCall = {
  call: string;
  args?: Record<string, A2UIDynamicValue>;
  message?: string;
};

export type A2UIDynamicValue =
  | string
  | number
  | boolean
  | null
  | A2UIPathRef
  | A2UIFunctionCall
  | A2UIDynamicValue[]
  | { [key: string]: A2UIDynamicValue };

export type A2UITemplatedChildren = {
  path: JsonPointer;
  componentId: string;
};

export type A2UIChildren = string[] | A2UITemplatedChildren;

export type A2UIEventAction = {
  event: {
    name: string;
    context?: Record<string, A2UIDynamicValue>;
  };
};

export type A2UIFunctionCallAction = {
  functionCall: A2UIFunctionCall;
};

export type A2UIAction = A2UIEventAction | A2UIFunctionCallAction;

export type A2UICheck = A2UIFunctionCall;

export interface A2UIComponent {
  id: string;
  component: string;
  child?: string;
  children?: A2UIChildren;
  checks?: A2UICheck[];
  action?: A2UIAction;
  [key: string]: unknown;
}

export interface A2UISnapshot {
  surfaceId: string;
  catalogId?: string;
  theme?: Record<string, unknown>;
  components: A2UIComponent[];
  data?: unknown;
}

export type StartOptions = {
  format?: "player" | "a2ui";
};

export const A2UI_EVENT_CONTEXT_NAMESPACE = "agent.event.context";
