# Handover: intermittent action-row missing after async-node update

**Player Android/JVM 0.15.3** · GenUX Agent Chat Android · owner: Android adaptor · 2026-07-22

## Symptom

On stream complete, the `streaming-response-action-row` (copy/feedback) asset intermittently doesn't render on the latest bot message. Consumer calls the async-node callback with a flat list `[agent-response-wrapper, streaming-response-action-row, renewedAsyncNode]` (flatten collection). Store update + handler append + asset build all succeed; the composable never runs.

## Log signature (the key clue)

- Store updated ✓
- Handler append ✓ (`actionRowAppendedToPlayer=true`)
- `BUILD_ASSET` fires ✓
- `RENDER` never fires ✗ → **asset is built but never composed**

## What we ruled out: Player **core** is clean

Wrote a core repro against tag `0.15.3` (`plugins/async-node/core`) reproducing the exact update shapes. **5/5 pass** — core's parse → resolve → flatten never drops the action-row:

| Suite | Shape covered | Result |
|---|---|---|
| flatten chained ×6 | renewed flatten async + action-row per update | ✓ |
| transform-based ×5 | real `agent-chat-container` (chat-message→collection transform) | ✓ |
| two-async/turn ×4 | `streaming-processor` node + FRF content node resolving in quick succession | ✓ |

Every action-row survives every update; counts match exactly. So the AST handed to Android is correct.

## Conclusion

Since `BUILD_ASSET` fires but `RENDER` doesn't, and core produces the correct tree, the drop is **downstream of core, in the Android adaptor's update → recomposition path** — not `plugins/async-node/core`.

```mermaid
flowchart LR
  A[callback: wrapper, action-row, renewedAsync] --> B[core parse/resolve/flatten]
  B -->|VERIFIED correct AST| C[Android onUpdate]
  C --> D[BUILD_ASSET fires]
  D -.->|RENDER missing intermittently| E[Compose recomposition]
  style E fill:#f88
```

## For Android team to investigate

1. **`AndroidPlayer.onUpdate`** — cache clear on every view update; confirm a newly appended flattened sibling isn't dropped from the rebuilt asset map.
2. **Compose recomposition / list diffing** of flattened collection children — does an appended sibling with a stable parent collection id get keyed/recomposed? Suspect stale keys or `remember` retaining the prior child list.
3. **Timing** — two async resolutions land close together (processor + content). Check for a race where the second update overwrites/skips the first's newly-built child.

## Why the workaround works (corroborates the above)

`replaceMessageContent(full content)` at `agentCompleteHandle` fixes it because a full replace forces a rebuild that the incremental Compose append sometimes skips. Reasonable to keep as mitigation while the adaptor is investigated.

## Repro

- Worktree pinned to tag: `../player-0.15.3` (`git describe` → `0.15.3`)
- Test: `plugins/async-node/core/src/__tests__/streaming-action-row.test.ts`
- Run: `node_modules/.bin/vitest run plugins/async-node/core/src/__tests__/streaming-action-row.test.ts`
- These are the JS/core-side proofs; the missing piece is an **Android-layer** test (AndroidPlayer.onUpdate + Compose) reproducing the append.

## Out of scope (separate issue)

`SKIP agentCompleteHandle no streamingMessageId` — stream lifecycle (completed with only a processor node, no FRF chunk). Different failure mode.
