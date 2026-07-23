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

## What we ALSO ruled out: the JS→Kotlin `onUpdate` data is correct

Wrote a JVM (platform-layer) test exercising the exact `view.hooks.onUpdate` boundary `AndroidPlayer` wraps. Across 6 chained streaming updates delivering `[wrapper, action-row, renewedAsync]`, **every action-row is present in the `onUpdate` payload** (counts exact). Ran on J2V8 — **PASS**.

`AndroidPlayer.onUpdate` feeds this same payload into `expandAsset`/Compose, so the data reaching the Android decode/render layer is correct. **This is not a data bug.**

- Test: `plugins/async-node/jvm/src/test/kotlin/.../asyncnode/StreamingActionRowTest.kt`
- Run: `bazel test //plugins/async-node/jvm:async-node-test`

## Conclusion (all four tiers now run)

Every layer exercised with the **reference** assets is clean: core AST (JS), the JS→Kotlin `onUpdate` data (JVM), decode (Robolectric), **and on-device Compose render (emulator)** — all streamed action-rows render. So the missing action-row is **NOT in Player core or the reference Android renderer**. It lives in the **GenUX-specific layer**: most likely (a) the custom `agent-response-wrapper` / `streaming-response-action-row` asset recomposition, or (b) the host's async stream-complete **callback threading**.

**Threading finding:** an iteration that resolved the stream on a *background* dispatcher threw `CalledFromWrongThreadException` (view touched off-main); only main-thread-marshaled updates render correctly. If GenUX's stream-complete callback isn't consistently on the main thread, that is a prime suspect for the intermittent drop.

```mermaid
flowchart LR
  A[callback: wrapper, action-row, renewedAsync] --> B[core parse/resolve/flatten]
  B -->|JS repro: 5/5 PASS| C[JS->Kotlin onUpdate]
  C -->|JVM repro: PASS| D[AndroidPlayer.onUpdate]
  D -->|Robolectric: decode OK| E[expandAsset decode]
  E -->|Compose-UI emulator: PASS, all render| F[reference Compose render]
  F -.->|drop only here| G[GenUX custom assets / host callback threading]
  style B fill:#8f8
  style C fill:#8f8
  style E fill:#8f8
  style F fill:#8f8
  style G fill:#f88
```

## Tier B (decode) — Android decode layer via Robolectric

`StreamingActionRowRenderTest.kt` (modeled on `ChatMessageAssetTest`/`AssetTest`) drives `AndroidPlayer.onUpdate → expandAsset` headless and confirms the **decode half is clean**: the chat-message→collection transform + async node resolve into the `RenderableAsset` tree with the Android renderers registered.

- Gotcha worth keeping: the collection first came back "not registered" because of a wrong import — you must use the **Android** `com.intuit.playerui.android.reference.assets.ReferenceAssetsPlugin`, not the core/JVM `com.intuit.playerui.plugins.assets` one.
- Robolectric proves decode only, not render: it doesn't run real Compose recomposition frames (`awaitCompleteHydration` hangs on async `SuspendableAsset` content). The **render** proof therefore lives on-device (Tier B render, below) — which passed.
- Test: `plugins/reference-assets/android/src/androidTest/kotlin/.../streaming/StreamingActionRowRenderTest.kt`
- Run: `bazel test //plugins/reference-assets/android:reference-assets-android-StreamingActionRowRenderTest-instrumented-test`

## Tier B (render) — on-device Compose-UI, PASS
- Test: `android/demo/src/androidTest/.../streaming/StreamingActionRowComposeUITest.kt` — asserts all streamed action-rows render (`waitUntilNodeCount(hasTestTag("action"), N)`). **Passes on an android-34 arm64 emulator** (alongside the 13 other demo UI tests).
- `DemoPlayerViewModel` includes an `AsyncNodePlugin` that **auto-streams** N accumulated `[wrapper, action-row, …]` updates via the callback **posted to `Dispatchers.Main`** (off-main resolution throws `CalledFromWrongThreadException`).
- Mock: `android/demo/src/main/assets/mocks/streaming/streaming-action-rows.json` (flatten collection + one live async node).
- `android/demo` `main_deps` += `//plugins/async-node/jvm`.
- Run: `bazel test //android/demo:android_instrumentation_test` (with `ANDROID_HOME`, `ANDROID_NDK_HOME`, `JAVA_TOOL_OPTIONS` truststore, and a booted emulator). Note: on-device method names must be space-free (D8 rejects spaces in DEX'd inline-lambda class names).

## Environment setup (to reproduce the Bazel/Android runs)

The 0.15.3 worktree needed all of the following (corporate proxy + fresh SDK):

1. Copy the git-ignored `.bazelrc.local` from the main checkout (trusts the Zscaler CA for the bazel *server* JVM).
2. Export `JAVA_TOOL_OPTIONS=-Djavax.net.ssl.trustStore=/Users/<you>/bazel-zscaler-truststore.jks -Djavax.net.ssl.trustStorePassword=changeit` so *spawned* resolver JVMs (android build-tools maven fetch) also trust the CA.
3. Export `ANDROID_HOME`/`ANDROID_SDK_ROOT` to the SDK.
4. The SDK only had `platforms/android-36.1`; rules_android only accepts integer API dirs (`android-<N>`, `level.isdigit()`), so symlink `android-36 → android-36.1` under `$ANDROID_HOME/platforms`. (Cleaner: install a stable integer platform, e.g. `android-35`, via the SDK Manager.)

### JVM Tier A sandbox note
Before the SDK was installed, the JVM test was run without an SDK by pointing the `async-node/jvm` test at the host-only `//jvm/j2v8:j2v8-macos` runtime (the default `//jvm/testutils:with-runtimes` pulls hermes + `j2v8-all`'s android AAR → needs `aapt2`). The committed BUILD keeps the normal `with-runtimes`.

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
