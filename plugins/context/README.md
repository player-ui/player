# Context Plugin

A per-flow store of context entries, keyed by name, that lets external consumers
(automation, devtools, native hosts) read, derive, and observe Player state
without tapping every controller hook themselves.

The package ships two plugins:

- **`ContextPlugin`** — the store. Holds named entries, supports derived
  (transform) entries, a subscribe API, and a per-flow history of snapshots.
- **`StateContextPlugin`** — a consumer of `ContextPlugin` that mirrors Player
  runtime state (flow, view, data, status) into the store and publishes an
  aggregated `player.state` entry with scoped, callable actions.

## Concepts

- **Entry** — a value stored under a `ContextKey` (a `description` + a globally
  unique symbol derived from a name via `Symbol.for`).
- **Transform** — a derived entry computed from other entries. It declares its
  `sources` and recomputes (and notifies subscribers) whenever any source
  changes.
- **History** — on flow end the active store is frozen into a snapshot and
  pushed onto a history stack, then a fresh store is created for the next flow.
  Transforms and subscribers persist across rotations; literal values do not.

## Installation

| Platform | Dependency |
| --- | --- |
| Core / JS | `@player-ui/context-plugin` |
| JVM / Android | `com.intuit.playerui.plugins:context:$VERSION` |
| iOS | the `PlayerUIContextPlugin` target |

---

## `ContextPlugin` (core)

```ts
import { Player } from "@player-ui/player";
import { ContextPlugin, defineContextKey } from "@player-ui/context-plugin";

const ctx = new ContextPlugin();
new Player({ plugins: [ctx] });

// Define a typed, globally-identifiable key.
const formStateKey = defineContextKey<{ name: string }>(
  "form.state",
  "Current form state",
);

ctx.set(formStateKey, { name: "Ada" });
ctx.has(formStateKey); // true
ctx.get(formStateKey); // { name: "Ada" }
```

### Derived entries (transforms)

A transform recomputes from its `sources` on read, and its subscribers fire when
any source updates.

```ts
const firstKey = defineContextKey<string>("first", "First name");
const lastKey = defineContextKey<string>("last", "Last name");
const fullNameKey = defineContextKey<string>("full", "Full name");

ctx.registerTransform(fullNameKey, {
  sources: [firstKey, lastKey],
  compute: (read) => `${read(firstKey)} ${read(lastKey)}`,
});

ctx.set(firstKey, "Ada");
ctx.set(lastKey, "Lovelace");
ctx.get(fullNameKey); // "Ada Lovelace"
```

### Function-valued entries

An entry's value may be a function. It is stored and read back as a directly
callable value — this is how `StateContextPlugin` exposes its actions.

```ts
const greetKey = defineContextKey<(name: string) => string>("greet", "Greeter");
ctx.set(greetKey, (name) => `hello ${name}`);
ctx.get(greetKey)?.("Ada"); // "hello Ada"
```

### Subscribing

```ts
// Per-key: fires whenever this entry (or, for a transform, one of its sources)
// changes. Returns a token for unsubscribe.
const token = ctx.subscribe(fullNameKey, (value) => console.log(value));

// Global: fires on every update with the changed key.
ctx.subscribeAll((value, key) => console.log(key.description, value));

ctx.unsubscribe(token);
```

### Introspection & history

```ts
ctx.list(); // [{ symbol, description, hasValue, hasTransform }, ...]

const [snapshot] = ctx.history(); // one frozen snapshot per ended flow
// Read a frozen entry by key — the same typed access as the live store:
snapshot.get(formStateKey); // { name: "Ada" } as it was when the flow ended
```

---

## `StateContextPlugin` (core)

Registering `StateContextPlugin` mirrors Player runtime state into the store. It
auto-registers a `ContextPlugin` if one isn't already present.

```ts
import { Player } from "@player-ui/player";
import {
  ContextPlugin,
  StateContextPlugin,
  playerStateContextKey,
} from "@player-ui/context-plugin";

const ctx = new ContextPlugin();
new Player({ plugins: [ctx, new StateContextPlugin()] });
```

It publishes these standard keys (each also importable):

| Key | Description |
| --- | --- |
| `flowIdContextKey` | `player.flow.id` — running flow id |
| `flowStateContextKey` | `player.flow.state` — current FSM state |
| `viewIdContextKey` | `player.view.id` — resolved view id |
| `viewContextKey` | `player.view` — resolved view object |
| `dataContextKey` | `player.data` — data model tree |
| `playerStatusContextKey` | `player.status` — not-started / in-progress / completed / error |
| `validationContextKey` | `player.validation` — active validations per binding + `canTransition` |
| `setDataActionKey` | `player.data.set` — callable that sets a binding |
| `transitionActionKey` | `player.flow.transition` — callable that transitions the flow |

### Aggregated `player.state`

`playerStateContextKey` is a transform that rolls everything up into one
`PlayerStateContext`. Actions are scoped to the construct they operate on:
`transition` under `flow`, `set` under `data`. Actions are bound to the live
controllers, so they are absent until a flow is in-progress.

```ts
const state = ctx.get(playerStateContextKey)!;

state.status; // "in-progress"
state.flow.state; // current FSM state name
state.data.model; // serialized data model

// Validation state for the running view, keyed by binding:
state.validation.canTransition; // false if a blocking validation is active
state.validation.byBinding["data.name"]; // [{ severity, message, displayTarget?, blocking? }]

// Drive the running Player through the scoped actions:
state.data.set?.("name", "Grace");
state.flow.transition?.("Next");
```

> **Validation requires binding tracking.** `player.validation` mirrors the
> validation controller, which only has state for bindings that the rendering
> layer tracks (e.g. via the reference-assets plugin). Without a renderer
> tracking bindings, validation is empty and `canTransition` is `true`. The
> mirror is a passive, side-effect-free read — it never triggers validation.

---

## Native consumers (JVM & iOS)

Native wrappers read entries by name and deserialize them into typed objects.
Function-valued members cross the bridge as callables, so the scoped actions are
invoked directly off the typed result.

### JVM / Kotlin

```kotlin
import com.intuit.playerui.plugins.context.ContextPlugin
import com.intuit.playerui.plugins.context.StateContextPlugin
import com.intuit.playerui.plugins.context.PlayerStateContext
import com.intuit.playerui.plugins.context.contextPlugin

val context = ContextPlugin()
val player = HeadlessPlayer(context, StateContextPlugin())
player.start(flow)

// Typed read; `get<T>` deserializes objects (incl. function members) and
// passes primitives through.
val state = player.contextPlugin?.get<PlayerStateContext>("player.state")
state?.data?.set?.invoke("name", "Grace")
state?.flow?.transition?.invoke("Next")

// Introspection / history — read a frozen entry by name, typed
val snapshot = player.contextPlugin?.history()?.last()
snapshot?.get<PlayerStateContext>("player.state")
```

### iOS / Swift

```swift
import PlayerUIContextPlugin

let context = ContextPlugin()
let player = HeadlessPlayerImpl(plugins: [context, StateContextPlugin()])
player.start(flow: flow) { _ in }

// `get<T>` decodes into a Decodable type; WrappedFunction members are callable.
let state = context.get(name: "player.state", as: PlayerStateContext.self)
state?.data.set?("name", "Grace")
state?.flow.transition?("Next")

// Introspection / history — read a frozen entry by name, typed
context.list() // [ContextEntryDescriptor]
let snapshot = context.history().last
snapshot?.get(name: "player.state", as: PlayerStateContext.self)
```

---

## Flow-end semantics

On flow end the active store is **frozen into a history snapshot and then
rotated** (a fresh store is created, with transforms re-applied and literals
dropped). Two consequences:

- **Functions become tombstones in snapshots.** A frozen entry keeps its key and
  description, but a captured function is replaced by a stub that throws if
  invoked — preserving the distinction between "context that never held this
  action" and "an action that is no longer valid".
- **Live reads right after a terminating transition are racy.** Flow end runs
  asynchronously, so reading `player.state` immediately after a transition that
  ends the flow may observe either the pre-rotation or post-rotation store. For
  end-of-flow state, read the **history snapshot** instead — `snapshot.get(key)`
  (or `get(name)` natively) gives the same typed access as the live store.

> **Reading snapshot entry values.** Across all platforms, read a frozen
> entry's value with the typed `snapshot.get(key)` / `get(name)` — `entries`
> exposes only the per-entry descriptor (`name`, `description`). The typed read
> is the one path that correctly surfaces function-valued entries (tombstones)
> on every platform.
