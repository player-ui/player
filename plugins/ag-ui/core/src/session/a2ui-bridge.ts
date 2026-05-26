import type { Asset } from "@player-ui/types";
import type { Logger } from "@player-ui/player";
import { adaptA2UIToFlow, type A2UISnapshot } from "@player-ui/a2ui-plugin";

/**
 * Convert an A2UI snapshot to the Asset subtree that should occupy AG-UI's
 * `surface` slot. We reuse the existing `adaptA2UIToFlow` adapter (so any A2UI
 * snapshot the platform supports works inside AG-UI) and then:
 *
 *   1. Extract the view root asset — we want the subtree to splice in, not
 *      a sibling flow.
 *   2. Rewrite any button-style action whose `value` is a transition target
 *      so it instead calls `agui_submitSurface(<eventName>)`. The original
 *      `exp` (context writes to `agent.event.context.*`) is preserved and
 *      run first; agui_submitSurface reads those writes back to build the
 *      structured payload. The transition `value` is removed so the surface
 *      submission doesn't try to end the AG-UI session flow.
 */
export function embedA2UISnapshot(
  snapshot: A2UISnapshot,
  logger?: Logger,
): Asset {
  const flow = adaptA2UIToFlow(snapshot, logger);
  const view = flow.views?.[0];
  if (!view) {
    throw new Error(
      "[ag-ui] adaptA2UIToFlow produced no view for the supplied A2UI snapshot",
    );
  }
  return rewriteActions(view as Asset);
}

/**
 * Walk the adapted asset tree. Any asset that has a `value` (transition
 * target) gets its transition rerouted through `agui_submitSurface`, leaving
 * other assets untouched. We mutate in place because the A2UI adapter built
 * the tree freshly for us — no risk of leaking changes back into A2UI state.
 */
function rewriteActions(asset: Asset): Asset {
  const anyAsset = asset as unknown as Record<string, unknown>;
  // ONLY rewrite buttons — other asset types use `value` for their data
  // binding (e.g. TextField.value is the path to the field's data). Touching
  // those would break the binding AND inject a spurious submit on render.
  if (anyAsset.type === "Button" && typeof anyAsset.value === "string") {
    const eventName = anyAsset.value;
    const existingExp = toExpArray(anyAsset.exp);
    anyAsset.exp = [
      ...existingExp,
      `@[agui_submitSurface(${JSON.stringify(eventName)})]@`,
    ];
    delete anyAsset.value;
  }

  for (const key of Object.keys(anyAsset)) {
    const v = anyAsset[key];
    if (isAssetWrapper(v)) {
      rewriteActions(v.asset);
    } else if (Array.isArray(v)) {
      for (const item of v) {
        if (isAssetWrapper(item)) rewriteActions(item.asset);
      }
    }
  }
  return asset;
}

function toExpArray(exp: unknown): string[] {
  if (Array.isArray(exp)) return exp as string[];
  if (typeof exp === "string") return [exp];
  return [];
}

function isAssetWrapper(value: unknown): value is { asset: Asset } {
  return (
    typeof value === "object" &&
    value !== null &&
    "asset" in (value as Record<string, unknown>) &&
    typeof (value as { asset?: unknown }).asset === "object" &&
    (value as { asset?: unknown }).asset !== null
  );
}
