import type { Asset } from "@player-ui/types";
import type { Logger } from "@player-ui/player";
import {
  AGUI_IS_RUNNING_PATH,
  AGUI_MESSAGES_PATH,
  type SessionMutation,
} from "./types";

/**
 * Per-session state held by the applier. Single async-node id per slot —
 * re-invoking the parked callback against the same id triggers
 * `parseNodeAndUpdate` in async-node-plugin, which updates the cached
 * resolution and re-renders. No chained seeds needed.
 */
export interface SessionApplierState {
  transcript: {
    /** Callback received from the async-node `onAsyncNode` tap; re-invoke on each event. */
    callback?: (result: unknown) => void;
    /** Final resolver — called once on session teardown to commit the terminal value. */
    resolver?: (result: unknown) => void;
    /** Append-only list of assets emitted to the transcript so far. */
    assets: Asset[];
  };
  surface: {
    callback?: (result: unknown) => void;
    resolver?: (result: unknown) => void;
    asset: Asset | null;
  };
}

export function createApplierState(): SessionApplierState {
  return {
    transcript: { assets: [] },
    surface: { asset: null },
  };
}

export interface MutationApplierDeps {
  state: SessionApplierState;
  /** Write a value through the live Player. Closure-bound by the session plugin. */
  setData(path: string, value: unknown): void;
  /** Read the current value at a binding. Used by streaming text deltas to append. */
  getData(path: string): unknown;
  logger?: Logger;
}

/**
 * Apply a single mutation against the live session.
 *
 * Transcript / surface mutations re-invoke the parked async-node callback,
 * which triggers `AsyncNodePluginPlugin.parseNodeAndUpdate` and
 * `viewController.updateViewAST` — that's how React learns the tree changed.
 *
 * Streaming-text and state mutations write to the data model instead. Each
 * text bubble has its `value` bound to a path in `agui.messages.*.content`,
 * so React re-renders the bubble in place without rebuilding the tree.
 */
export function applyMutation(
  mutation: SessionMutation,
  deps: MutationApplierDeps,
): void {
  switch (mutation.kind) {
    case "appendTranscript":
      appendTranscript(mutation.asset, deps);
      return;

    case "setSurface":
      setSurface(mutation.asset, deps);
      return;

    case "streamTextDelta": {
      const path = `${AGUI_MESSAGES_PATH}.${mutation.messageId}.content`;
      const current = deps.getData(path);
      const next =
        typeof current === "string" ? current + mutation.delta : mutation.delta;
      deps.setData(path, next);
      return;
    }

    case "setData":
      deps.setData(mutation.path, mutation.value);
      return;

    case "applyStateDelta":
      applyJsonPatches(mutation.patches, deps);
      return;

    case "setStatus":
      deps.setData(AGUI_IS_RUNNING_PATH, mutation.status === "running");
      return;

    default: {
      const exhaustive: never = mutation;
      deps.logger?.warn?.(
        `[ag-ui] applier received unknown mutation: ${JSON.stringify(exhaustive)}`,
      );
    }
  }
}

function appendTranscript(asset: Asset, deps: MutationApplierDeps): void {
  const { transcript } = deps.state;
  transcript.assets.push(asset);
  if (!transcript.callback) {
    // No subscriber yet — the seed hasn't been hit by the resolver. The next
    // resolution will pick up the accumulated list, so just record it.
    return;
  }
  transcript.callback({
    values: transcript.assets.map((a) => ({ asset: a })),
  });
}

function setSurface(asset: Asset | null, deps: MutationApplierDeps): void {
  const { surface } = deps.state;
  surface.asset = asset;
  if (!surface.callback) return;
  if (asset === null) {
    surface.callback(undefined);
    return;
  }
  surface.callback({ asset });
}

/**
 * Minimal RFC 6902 implementation covering `add`, `replace`, `remove`. The
 * AG-UI state channel is the only place we apply patches; anything outside
 * the supported ops is logged and skipped so a malformed patch never takes
 * down the session.
 */
function applyJsonPatches(
  patches: Array<{ op: string; path: string; value?: unknown }>,
  deps: MutationApplierDeps,
): void {
  for (const patch of patches) {
    const dataPath = jsonPointerToDataPath(patch.path);
    if (!dataPath) {
      deps.logger?.warn?.(
        `[ag-ui] state-delta patch with unsupported path '${patch.path}' skipped`,
      );
      continue;
    }
    switch (patch.op) {
      case "add":
      case "replace":
        deps.setData(dataPath, patch.value);
        break;
      case "remove":
        deps.setData(dataPath, undefined);
        break;
      default:
        deps.logger?.warn?.(
          `[ag-ui] state-delta patch with unsupported op '${patch.op}' skipped`,
        );
    }
  }
}

/**
 * RFC 6902 paths look like `/a/b/c`. Convert to dot-notation Player bindings
 * (`agui.state.a.b.c`). Returns `null` for the empty/root path — whole-state
 * replacement should arrive as a `STATE_SNAPSHOT` event instead.
 */
function jsonPointerToDataPath(pointer: string): string | null {
  if (!pointer || pointer === "/") return null;
  const parts = pointer
    .replace(/^\//, "")
    .split("/")
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  return ["agui", "state", ...parts].join(".");
}
