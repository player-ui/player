import type { Asset } from "@player-ui/types";
import type { Logger } from "@player-ui/player";
import {
  AGUI_IS_RUNNING_PATH,
  AGUI_MESSAGES_PATH,
  TRANSCRIPT_SEED_PREFIX,
  type SessionMutation,
} from "./types";

/**
 * Per-session state held by the applier.
 *
 *  - `transcript` uses a linked-list of async-node seeds: each resolution
 *    emits an array of new asset wrappers followed by a fresh seed with
 *    `flatten: true`, so the parent's values list grows turn by turn and the
 *    trailing seed parks the next callback. Once an async node has resolved
 *    Player can't re-resolve it, hence the chaining.
 *
 *  - `surface` is a single async-node held in a single-asset slot. Each new
 *    A2UI snapshot re-invokes the same callback with the unwrapped asset.
 */
export interface SessionApplierState {
  transcript: {
    /** Callback for the *current* (latest) seed in the chain. */
    callback?: (result: unknown) => void;
    /** Final resolver — called on session teardown. */
    resolver?: (result: unknown) => void;
    /** Every bubble ever added; append-only. */
    assets: Asset[];
    /** How many of `assets` have been emitted through some callback. */
    emittedCount: number;
    /** Monotonic counter used to mint fresh seed ids. */
    nextSeedCounter: number;
  };
  surface: {
    callback?: (result: unknown) => void;
    resolver?: (result: unknown) => void;
    asset: Asset | null;
  };
}

export function createApplierState(): SessionApplierState {
  return {
    transcript: { assets: [], emittedCount: 0, nextSeedCounter: 1 },
    surface: { asset: null },
  };
}

export interface MutationApplierDeps {
  state: SessionApplierState;
  setData(path: string, value: unknown): void;
  getData(path: string): unknown;
  logger?: Logger;
}

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
  deps.state.transcript.assets.push(asset);
  flushPendingTranscript(deps.state);
}

/**
 * Emit any unsent transcript assets through the currently-parked callback,
 * trailing a fresh seed so the chain continues. Called both when new events
 * arrive (`appendTranscript`) and when a new seed parks (session plugin) —
 * the latter replays anything buffered before the seed was parked.
 *
 * Exported so the session plugin can drive it on first seed registration.
 */
export function flushPendingTranscript(state: SessionApplierState): void {
  const { transcript } = state;
  if (!transcript.callback) return;
  const pending = transcript.assets.slice(transcript.emittedCount);
  if (pending.length === 0) return;
  transcript.emittedCount = transcript.assets.length;
  const nextSeedId = `${TRANSCRIPT_SEED_PREFIX}-${transcript.nextSeedCounter++}`;
  // Detach the callback from this seed — the chained seed will park its own.
  const cb = transcript.callback;
  transcript.callback = undefined;
  cb([
    ...pending.map((a) => ({ asset: a })),
    { async: true, flatten: true, id: nextSeedId },
  ]);
}

function setSurface(asset: Asset | null, deps: MutationApplierDeps): void {
  const { surface } = deps.state;
  surface.asset = asset;
  if (!surface.callback) return;
  // Surface seed sits at a single-asset slot. Resolved value is the inner
  // asset shape — Player wraps it in `{ asset: ... }` from the slot context.
  surface.callback(asset ?? undefined);
}

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

function jsonPointerToDataPath(pointer: string): string | null {
  if (!pointer || pointer === "/") return null;
  const parts = pointer
    .replace(/^\//, "")
    .split("/")
    .map((p) => p.replace(/~1/g, "/").replace(/~0/g, "~"));
  return ["agui", "state", ...parts].join(".");
}
