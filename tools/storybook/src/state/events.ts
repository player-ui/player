import { v4 as uuid } from "uuid";
import type { PlayerFlowStatus, Severity } from "@player-ui/react";

interface BaseEventType<T extends string> {
  /** A timestamp for the event */
  time: number;
  /** the event id */
  id: string;
  /** the event type */
  type: T;
}

export interface LogEventType extends BaseEventType<"log"> {
  /** the message */
  message: Array<unknown>;
  /** the log severity */
  severity: Severity;
}

export interface DataChangeEventType extends BaseEventType<"dataChange"> {
  /** The binding */
  binding: string;
  /** the old value */
  from: unknown;
  /** the new value */
  to: unknown;
}

export interface StateChangeEventType extends BaseEventType<"stateChange"> {
  /** The state type */
  state: PlayerFlowStatus;
  /** The error message */
  error?: string;
  /** The outcome */
  outcome?: string;
}

export interface MetricChangeEventType extends BaseEventType<"metric"> {
  /** The metric type */
  metricType: string;

  /** The message for the metrics change type */
  message: string;
}

export type EventType =
  | LogEventType
  | DataChangeEventType
  | StateChangeEventType
  | MetricChangeEventType;

/** Create an event for the timeline */
export function createEvent<T extends EventType>(
  base: Omit<T, "id" | "time">,
): T {
  return {
    id: uuid(),
    time: Date.now(),
    ...base,
  } as T;
}
