# Context Plugin

A per-flow store of context entries, keyed by name, that lets external consumers
(automation, devtools, native hosts) read, derive, and observe Player state
without tapping every controller hook themselves.

The package ships three plugins:

- **`ContextPlugin`** — the store. Holds named entries, supports derived
  (transform) entries, a subscribe API, and a per-flow history of snapshots.
- **`StateContextPlugin`** — a consumer of `ContextPlugin` that mirrors Player
  runtime state (flow, view, data, status) into the store and publishes an
  aggregated `player.state` entry with scoped, callable actions.
- **`AssetContextPlugin`** — lets each asset type declare which of its resolved
  properties are published to the store, so consumers get a per-asset,
  per-view snapshot without walking the view tree.

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

| Platform      | Dependency                                     |
| ------------- | ---------------------------------------------- |
| Core / JS     | `@player-ui/context-plugin`                    |
| JVM / Android | `com.intuit.playerui.plugins:context:$VERSION` |
| iOS           | the `PlayerUIContextPlugin` target             |

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
import { ContextPlugin, StateContextPlugin } from "@player-ui/context-plugin";

const ctx = new ContextPlugin();
new Player({ plugins: [ctx, new StateContextPlugin()] });
```

It publishes these standard keys (each also importable):

| Key                      | Description                                                            |
| ------------------------ | ---------------------------------------------------------------------- |
| `flowIdContextKey`       | `player.flow.id` — running flow id                                     |
| `flowStateContextKey`    | `player.flow.state` — current FSM (finite state machine) state         |
| `viewIdContextKey`       | `player.view.id` — resolved view id                                    |
| `viewContextKey`         | `player.view` — resolved view object                                   |
| `dataContextKey`         | `player.data` — data model tree                                        |
| `playerStatusContextKey` | `player.status` — not-started / in-progress / completed / error        |
| `validationContextKey`   | `player.validation` — active validations per binding + `canTransition` |
| `setDataActionKey`       | `player.data.set` — callable that sets a binding                       |
| `transitionActionKey`    | `player.flow.transition` — callable that transitions the flow          |

### Aggregated `player.state`

`playerStateContextKey` is a separate, importable key — not one of the
standard keys in the table above — backed by a transform that rolls
everything up into one `PlayerStateContext`. Actions are scoped to the
construct they operate on: `transition` under `flow`, `set` under `data`.
Actions are bound to the live controllers, so they are absent until a flow is
in-progress.

```ts
import { playerStateContextKey } from "@player-ui/context-plugin";

const state = ctx.get(playerStateContextKey)!;

state.status; // "not-started" | "in-progress" | "completed" | "error"
state.flow?.state; // current FSM (finite state machine) state name
state.data?.model; // serialized data model

// Validation state for the running view, keyed by binding:
state.validation?.canTransition; // false if a blocking validation is active
state.validation?.byBinding["data.name"]; // [{ severity, message, displayTarget?, blocking? }]

// Drive the running Player through the scoped actions:
state.data?.set?.("name", "Grace");
state.flow?.transition?.("Next");
```

> **Validation requires binding tracking.** `player.validation` mirrors the
> validation controller, which only has state for bindings that the rendering
> layer tracks (e.g. via the reference-assets plugin). Without a renderer
> tracking bindings, validation is empty and `canTransition` is `true`. The
> mirror is a passive, side-effect-free read — it never triggers validation.

---

## `AssetContextPlugin` (core)

Asset types opt in with a **descriptor**: a small, declarative description of
which resolved properties to publish. The plugin taps the view resolver and,
whenever a described asset (or view) resolves, writes its entry to the store.
Assets without a descriptor are ignored. It auto-registers a `ContextPlugin` if
one isn't already present, and never modifies the resolved view.

```ts
import { Player } from "@player-ui/player";
import { ReferenceAssetsPlugin } from "@player-ui/reference-assets-plugin";
import {
  ContextPlugin,
  AssetContextPlugin,
  defineAssetContext,
  assetContextKey,
  viewAssetsContextKey,
} from "@player-ui/context-plugin";

const inputContext = defineAssetContext({
  fields: { binding: "binding", value: "value", label: "label.asset.value" },
});
const textContext = defineAssetContext({ fields: { value: "value" } });

const ctx = new ContextPlugin();
const player = new Player({
  plugins: [
    ctx,
    new ReferenceAssetsPlugin(),
    new AssetContextPlugin([
      [{ type: "input" }, inputContext],
      [{ type: "text" }, textContext],
    ]),
  ],
});

player.start(flow);

ctx.get(assetContextKey("name-input"));
// { id: "name-input", type: "input", binding: "data.name", value: "Ada", label: "Name" }

ctx.get(viewAssetsContextKey);
// [{ id: "name-input-label", type: "text", value: "Name" }, { id: "name-input", ... }]
```

Descriptors are matched against the asset with the same partial-match rules as
asset transforms, so a more specific match wins over a less specific one:

```ts
new AssetContextPlugin([
  [{ type: "action" }, actionContext],
  [{ type: "action", metaData: { role: "back" } }, backActionContext],
]);
```

Any plugin can contribute more descriptors at any time. If several
`AssetContextPlugin` instances are registered, they share the first one's
registry.

```ts
import { getAssetContextPlugin } from "@player-ui/context-plugin";

getAssetContextPlugin(player).register([[{ type: "image" }, imageContext]]);
```

### Descriptor reference

`defineAssetContext<T>(descriptor)` types a descriptor against an asset shape.

| Option     | Purpose                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------- |
| `fields`   | Output key → property path (`"value"`, `"metaData.role"`) or extractor `(asset) => unknown` |
| `children` | Slot paths whose nested asset ids are recorded under `children`                             |
| `collate`  | Slots whose nested assets are rolled up into this entry (see [Collation](#collation))       |
| `extract`  | Escape hatch: `(asset) => object`, merged last                                              |

Every entry has the asset's `id` and `type`; nothing else is published unless a
descriptor asks for it. Extracted values that are `undefined` or functions are
skipped, so callables like an action's `run` never reach the store — act on the
running Player through `StateContextPlugin`'s scoped actions instead.

Helpers for building fields:

```ts
import { constant, each, prop } from "@player-ui/context-plugin";

const choiceContext = defineAssetContext({
  fields: {
    // Property path, same as the "binding" string shorthand.
    binding: prop("binding"),
    // A fixed value.
    kind: constant("single-select"),
    // Map every item of an array through its own fields.
    options: each("choices", { id: "id", label: "label.asset.value" }),
  },
});
```

`children` records the ids of the nearest described assets under each slot.
Assets without a descriptor are walked through, so a wrapper asset with no
descriptor of its own doesn't hide what's inside it:

```ts
const collectionContext = defineAssetContext({
  fields: { label: "label.asset.value" },
  children: ["values"],
});
// { id: "profile", type: "collection", label: "Profile",
//   children: { values: ["name-input", "email-input"] } }
```

#### Keeping field types

`defineAssetContext<T>` checks a descriptor against `T`, but its return type is
the general `AssetContextDescriptor<T>`, so the names of the declared fields are
lost. If you want to derive types from a descriptor, declare it with
`satisfies` instead. The descriptor is still checked against the asset shape,
extractors still get a typed `asset` parameter, and the object keeps its
literal type:

```ts
import type { InputAsset } from "@player-ui/reference-assets-plugin";
import type { AssetContextDescriptor } from "@player-ui/context-plugin";

const inputContext = {
  fields: {
    binding: "binding",
    label: (asset) => asset.label?.asset.id, // asset: InputAsset
  },
} satisfies AssetContextDescriptor<InputAsset>;

type InputFields = keyof typeof inputContext.fields; // "binding" | "label"
type InputLabel = ReturnType<typeof inputContext.fields.label>; // string | undefined
```

Path strings such as `"binding"` widen to `string`, so only an extractor
carries its value type. Registration is the same either way.

### Published keys

| Key                                         | Value                                                      |
| ------------------------------------------- | ---------------------------------------------------------- |
| `assetContextKey(id)` — `player.asset.<id>` | One asset's entry: `{ id, type, ...fields }`               |
| `viewAssetIdsContextKey`                    | Ids of every described asset in the current view           |
| `viewAssetsContextKey`                      | Top-level entries; collated descendants are nested instead |
| `viewAllAssetsContextKey`                   | Every entry, flat, including collated descendants          |

View-level lists follow document order, so a parent comes before the assets
nested in it.

Entries track what's actually on screen. After each view update, an asset that
is no longer in the resolved view has its entry cleared to `undefined`, and
subscribers are notified. This covers assets removed by applicability, or by a
parent that stops rendering them. An asset that comes back is published again,
in its original position. On a new view, the previous view's entries are
cleared too.

An entry is rewritten only when Player's own dependency tracking re-resolves
that asset, so an unrelated data change doesn't touch it:

```ts
ctx.subscribe(assetContextKey("email-input"), onEmail);
dataController.set([["data.name", "Grace"]]); // onEmail is not called
```

### Collation

Some assets are only meaningful inside their parent — a label is just a string
until you know what it labels. A parent can roll its descendants up into its
own entry with `collate`. The children keep their own descriptors and don't
need to know they're being collated.

```ts
const collectionContext = defineAssetContext({
  fields: { label: "label.asset.value" },
  collate: [{ slot: "values", as: "items" }],
});
```

```jsonc
// player.asset.profile
{
  "id": "profile",
  "type": "collection",
  "label": "Profile",
  "items": [
    {
      "id": "name-input",
      "type": "input",
      "binding": "data.name",
      "value": "Ada",
    },
    {
      "id": "email-input",
      "type": "input",
      "binding": "data.email",
      "value": "ada@example.com",
    },
  ],
}
```

| Option   | Default   | Meaning                                                         |
| -------- | --------- | --------------------------------------------------------------- |
| `slot`   | —         | Where to look under the parent (`"values"`, `["a", "b"]`)       |
| `as`     | slot name | Output key on the parent entry                                  |
| `depth`  | `"all"`   | How many described levels to embed; `1` embeds the nearest only |
| `hide`   | `true`    | Omit collated descendants from `viewAssetsContextKey`           |
| `reduce` | —         | `(entries) => unknown` to summarize instead of embedding        |

A string spec is shorthand for `{ slot }` with every other option defaulted:
`collate: ["values"]`.

- **Depth.** With the default `"all"`, each embedded entry carries its own
  described descendants under `children`, keyed by the property they were found
  under, all the way down. With `depth: 1`, only the nearest described
  descendants are embedded; anything below them stays a top-level entry.
- **Nesting.** A descendant that has its own `collate` is embedded as-is — its
  entry already carries its rolled-up descendants.
- **Liveness.** The parent's entry is a transform over its descendants' entries,
  so it updates whenever one of them does.
- **Visibility.** Collated descendants are always readable at
  `player.asset.<id>` and listed in `viewAllAssetsContextKey`. With
  `hide: false` they're also kept in `viewAssetsContextKey`.

Summarize instead of embedding with `reduce`:

```ts
const collectionContext = defineAssetContext({
  fields: { label: "label.asset.value" },
  collate: [
    {
      slot: "values",
      as: "summary",
      reduce: (entries) => entries.map((entry) => entry.value).join(", "),
    },
  ],
});
// { id: "profile", type: "collection", label: "Profile",
//   summary: "Ada, ada@example.com" }
```

A descendant that stops rendering, for example because it's no longer
applicable, drops out of its parent's collated entries on the same update.

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
state?.data?.set?("name", "Grace")
state?.flow?.transition?("Next")

// Introspection / history — read a frozen entry by name, typed
context.list() // [ContextEntryDescriptor]
let snapshot = context.history().last
snapshot?.get(name: "player.state", as: PlayerStateContext.self)
```

### Asset context

`AssetContextPlugin` doesn't have typed native wrappers yet. When it's
registered in the core JS bundle, its entries are plain objects and can be read
by name like any other entry, e.g. `player.view.assets` or
`player.asset.<id>`.

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
