import type {
  AGUIAgent,
  AGUIEvent,
  AGUIEventHandlers,
  AGUIMessage,
  AGUISubscription,
} from "@player-ui/ag-ui-plugin";

/**
 * Frame in a scripted agent's tape. A frame is either a single event to emit
 * synchronously, a sleep before the next frame, or a "wait-for-run" pause
 * that releases when the next `runAgent()` is called. The pause frame is what
 * makes scripted multi-turn conversations work: the tape can describe both
 * sides of the dialog without the test having to manually advance state.
 */
export type TapeFrame =
  | { kind: "emit"; event: AGUIEvent }
  | { kind: "sleep"; ms: number }
  | { kind: "wait" };

export interface ScriptedAgentOptions {
  threadId?: string;
  /** Initial message history. */
  messages?: AGUIMessage[];
  /**
   * Tape played each time `runAgent()` is invoked. A `wait` frame pauses
   * playback until the next `runAgent()` call. The same tape replays from the
   * start on every run unless `tapeFor` is provided.
   */
  tape?: TapeFrame[];
  /**
   * Per-run tape selector. Receives the run index (0-based) and returns the
   * tape for that run. Wins over `tape` if provided.
   */
  tapeFor?(runIndex: number, messages: AGUIMessage[]): TapeFrame[];
  /**
   * Kick off the first `runAgent()` automatically when the first subscriber
   * attaches. Useful for stories and demos where you want the tape to play as
   * soon as the UI hooks up. Off by default so unit tests can drive the agent
   * explicitly. Only the first attach triggers the auto-run; later subscribers
   * see whatever the agent emits at its own pace.
   */
  autoStart?: boolean;
}

/**
 * In-process `AGUIAgent` that replays a canned event tape. Useful for unit
 * tests and Storybook stories — no network, deterministic, supports multi-run
 * dialogs via the `wait` frame.
 */
export class ScriptedAgent implements AGUIAgent {
  public messages: AGUIMessage[];
  public readonly threadId?: string;

  private handlers: Set<AGUIEventHandlers> = new Set();
  private runIndex = 0;
  private autoStarted = false;

  constructor(private readonly opts: ScriptedAgentOptions = {}) {
    this.threadId = opts.threadId;
    this.messages = opts.messages ?? [];
  }

  subscribe(handlers: AGUIEventHandlers): AGUISubscription {
    this.handlers.add(handlers);
    if (this.opts.autoStart && !this.autoStarted) {
      this.autoStarted = true;
      // Defer so the session plugin can finish parking its async-node callbacks
      // before tape events start arriving. `queueMicrotask` is enough because
      // the resolver visits the seed nodes synchronously inside the same task
      // that subscribed us.
      queueMicrotask(() => {
        void this.runAgent({});
      });
    }
    return {
      unsubscribe: () => {
        this.handlers.delete(handlers);
      },
    };
  }

  async runAgent(_input?: Record<string, unknown>): Promise<unknown> {
    const tape =
      this.opts.tapeFor?.(this.runIndex, this.messages) ?? this.opts.tape ?? [];
    this.runIndex += 1;
    for (const frame of tape) {
      if (frame.kind === "emit") {
        this.broadcast(frame.event);
      } else if (frame.kind === "sleep") {
        await new Promise<void>((resolve) => setTimeout(resolve, frame.ms));
      } else if (frame.kind === "wait") {
        // Pause: yield to the caller (e.g., to simulate the agent waiting for
        // another user turn). Test code can call runAgent again to continue.
        return undefined;
      }
    }
    return undefined;
  }

  /** Test helper: drive the agent directly without invoking `runAgent()`. */
  emit(event: AGUIEvent): void {
    this.broadcast(event);
  }

  private broadcast(event: AGUIEvent): void {
    for (const h of this.handlers) {
      h.onEvent?.({ event });
      // Also fire the per-type handler for SDK-compat consumers that only
      // attach the typed handlers.
      const typed = `on${toPascal(event.type)}Event` as keyof AGUIEventHandlers;
      const fn = (h as Record<string, unknown>)[typed];
      if (typeof fn === "function") {
        (fn as (p: { event: AGUIEvent }) => void)({ event });
      }
    }
  }
}

function toPascal(snake: string): string {
  return snake
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}
