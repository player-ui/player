---
name: Create JVM Player Plugin (Kotlin)
description: Use when the user wants to create a JVM/Kotlin plugin for Player UI. Covers pure Kotlin PlayerPlugin, JS-backed plugins via JSScriptPluginWrapper, RuntimePlugin, LoggerPlugin, Plugin-only markers, the hook system, player state management, coroutine integration, async flow results, and testing. For the user's own JVM/Kotlin project.
version: "2.1"
argument-hint: "[plugin-name e.g. analytics-tracker]"
---

# Create JVM Player Plugin (Kotlin)

You are helping a developer create a JVM/Kotlin plugin for Player UI in their own project. JVM plugins extend the headless Player runtime, which executes flows without a UI layer.

**Before writing any code**, confirm the plugin name and whether it wraps an existing JS plugin or is pure Kotlin.

---

## Install Dependencies

Add to your `build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.intuit.playerui:core:<version>")

    // Choose a JavaScript runtime (required for running flows):
    implementation("com.intuit.playerui:hermes:<version>")      // Recommended — Facebook's Hermes engine
    // or J2V8:
    // implementation("com.intuit.playerui:j2v8-all:<version>")  // All platforms
    // implementation("com.intuit.playerui:j2v8-macos:<version>")
    // implementation("com.intuit.playerui:j2v8-linux:<version>")
    // or GraalJS:
    // implementation("org.graalvm.js:js:<version>")
    // implementation("com.intuit.playerui:graaljs:<version>")

    // Serialization (for NodeWrapper data classes):
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:<version>")

    testImplementation("org.junit.jupiter:junit-jupiter:<version>")
    testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:<version>")
}
```

For Maven:

```xml
<dependency>
    <groupId>com.intuit.playerui</groupId>
    <artifactId>core</artifactId>
    <version>${player.version}</version>
</dependency>
<dependency>
    <groupId>com.intuit.playerui</groupId>
    <artifactId>hermes</artifactId>
    <version>${player.version}</version>
</dependency>
```

---

## Plugin Types

There are four plugin interfaces, all extending the base `Plugin` marker interface. They are applied in a specific order during player initialization. A class may also implement only the `Plugin` marker for discovery via `findPlugin()` without any lifecycle callbacks.

### 1. RuntimePlugin — Configure the JS Runtime

Applied **first**, before any player plugins. Use this when you need to add JS globals or configure the runtime itself:

```kotlin
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.plugins.RuntimePlugin

class <PluginName> : RuntimePlugin {
    override fun apply(runtime: Runtime<*>) {
        // Add globals or configure the JS runtime before the player is created
    }
}
```

### 2. PlayerPlugin — Pure Kotlin Plugin

For custom behavior that hooks into the Player lifecycle without needing a JavaScript counterpart. Applied **after** RuntimePlugins:

```kotlin
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.core.plugins.PlayerPlugin

class <PluginName> : PlayerPlugin {

    override fun apply(player: Player) {
        player.hooks.state.tap(pluginName) { state ->
            when (state) {
                is InProgressState -> {
                    // Flow is active — access controllers, data model, etc.
                }
                is ErrorState -> {
                    // Handle error
                }
            }
        }

        player.hooks.flowController.tap(pluginName) { fc ->
            // Access flow controller for navigation
        }
    }

    private companion object {
        private const val pluginName = "<PluginName>"
    }
}
```

The `PlayerPlugin` interface defines only `apply(player: Player)`. There is no `pluginName` property on the interface — use a local constant or `this::class.simpleName` as the tap identifier.

The `tap` method supports both named and unnamed variants:

```kotlin
player.hooks.state.tap("MyPlugin") { state -> /* ... */ }  // Named tap
player.hooks.state.tap { state -> /* ... */ }               // Anonymous tap (uses caller stack trace as name)
```

### 3. LoggerPlugin — Custom Logging

Extends `PlayerPlugin` with logging methods. `HeadlessPlayer` gives `LoggerPlugin` instances special handling — they are merged with any ServiceLoader-discovered loggers and wired into the JS Player's config so JS-side `console.*` calls forward to your logger:

```kotlin
import com.intuit.playerui.core.plugins.LoggerPlugin

class <PluginName> : LoggerPlugin {
    override fun trace(vararg args: Any?) { /* ... */ }
    override fun debug(vararg args: Any?) { /* ... */ }
    override fun info(vararg args: Any?)  { /* ... */ }
    override fun warn(vararg args: Any?)  { /* ... */ }
    override fun error(vararg args: Any?) { /* ... */ }
}
```

`LoggerPlugin` inherits a default no-op `apply(player: Player)`, so you only need to override the logging methods. To discover the active logger from any `Pluggable`, use the `Pluggable.logger` extension.

### 4. Plugin-Only (Marker Interface)

When a plugin holds state or hooks that other code retrieves via `findPlugin()` but does not need lifecycle callbacks, implement only the base `Plugin` interface:

```kotlin
import com.intuit.playerui.core.plugins.Plugin

class <PluginName> : Plugin {
    val hooks = CustomHooks()
    // No apply() — HeadlessPlayer will not call anything on this plugin,
    // but it remains in the plugins list for findPlugin<>() discovery.
}
```

### 5. JS-Backed Plugin (Wrapping a TypeScript Core Plugin)

Loads a compiled JavaScript bundle (`.native.js`) and bridges JS hooks to Kotlin. Extend `JSScriptPluginWrapper`:

```kotlin
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.hooks.NodeSyncHook1
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.serialization.serializers.NodeSerializableField
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
import com.intuit.playerui.core.plugins.findPlugin
import kotlinx.serialization.Serializable

class <PluginName> : JSScriptPluginWrapper(PLUGIN_NAME, sourcePath = BUNDLED_SOURCE_PATH) {

    lateinit var hooks: Hooks

    override fun apply(runtime: Runtime<*>) {
        runtime.load(ScriptContext(script, BUNDLED_SOURCE_PATH))
        instance = runtime.buildInstance("(new $name())")

        hooks = instance.getSerializable("hooks", Hooks.serializer())
            ?: throw PlayerException("$PLUGIN_NAME hooks not loaded correctly")
    }

    @Serializable(Hooks.Serializer::class)
    class Hooks internal constructor(override val node: Node) : NodeWrapper {
        val onEvent: NodeSyncHook1<String>
            by NodeSerializableField(NodeSyncHook1.serializer(String.serializer()))

        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    private companion object {
        private const val PLUGIN_NAME = "<PluginName>.<PluginName>"
        private const val BUNDLED_SOURCE_PATH = "plugins/<plugin-name>/core/dist/<PluginName>.native.js"
    }
}

/** Convenience extension to find this plugin on a Player instance */
val Player.<camelName>: <PluginName>? get() = findPlugin()
```

**Key points:**

- `PLUGIN_NAME` uses `"<PluginName>.<PluginName>"` format — the IIFE `globalName.ClassName` matching the JS bundle's export structure.
- The `name` property (inherited from `JSScriptPluginWrapper`) is set from `PLUGIN_NAME`, so `buildInstance("(new $name())")` produces `(new <PluginName>.<PluginName>())`.
- For no-arg constructors, `runtime.buildInstance()` (no argument) works since the default expression is `(new $name())`.
- The `.native.js` bundle must be on the classpath at runtime. Place it in `src/main/resources/`.

### 5a. JS-Backed Plugin with Constructor Arguments

When the JS plugin requires constructor parameters, inject them into the runtime first:

```kotlin
class <PluginName>(
    private val config: Config? = null,
) : JSScriptPluginWrapper(PLUGIN_NAME, sourcePath = BUNDLED_SOURCE_PATH) {

    override fun apply(runtime: Runtime<*>) {
        config?.let {
            runtime.load(ScriptContext(script, BUNDLED_SOURCE_PATH))
            runtime.add("pluginConfig", config)
            instance = runtime.buildInstance("(new $name(pluginConfig))")
        } ?: super.apply(runtime)
    }

    @Serializable
    data class Config(val expressionName: String)

    private companion object {
        private const val PLUGIN_NAME = "<PluginName>.<PluginName>"
        private const val BUNDLED_SOURCE_PATH = "plugins/<plugin-name>/core/dist/<PluginName>.native.js"
    }
}
```

### 5b. JS-Backed + PlayerPlugin (Dual Interface)

When a plugin needs both JS runtime access **and** JVM Player hooks, implement both interfaces:

```kotlin
class <PluginName>(
    private var handler: ExternalHandler? = null,
) : JSScriptPluginWrapper(PLUGIN_NAME, sourcePath = BUNDLED_SOURCE_PATH),
    PlayerPlugin {

    private lateinit var player: Player

    override fun apply(player: Player) {
        this.player = player
    }

    override fun apply(runtime: Runtime<*>) {
        runtime.load(ScriptContext(script, BUNDLED_SOURCE_PATH))
        runtime.add("handler") { args: Node ->
            handler?.handle(args)
        }
        instance = runtime.buildInstance("""(new $name(handler))""")
    }

    private companion object {
        private const val PLUGIN_NAME = "<PluginName>.<PluginName>"
        private const val BUNDLED_SOURCE_PATH = "plugins/<plugin-name>/core/dist/<PluginName>.native.js"
    }
}
```

The runtime-level `apply(runtime: Runtime<*>)` runs first (as a `RuntimePlugin`), then `apply(player: Player)` runs during player setup.

---

## Architecture: JS-Backed Plugins

```
┌──────────────────────────────────────────────────┐
│  Kotlin / JVM                                    │
│  <PluginName> extends JSScriptPluginWrapper      │
│    → runtime.load(script)    ← loads JS bundle   │
│    → runtime.buildInstance() ← constructs JS obj │
│    → hooks via NodeWrapper   ← bridges JS hooks  │
└──────────────────────────────────────────────────┘
        ↕  Hermes / J2V8 / GraalJS
┌──────────────────────────────────────────────────┐
│  JavaScript  (<PluginName>.native.js)            │
│  IIFE bundle with globalName = "<PluginName>"    │
│  Expression: (new <PluginName>.<PluginName>())   │
└──────────────────────────────────────────────────┘
```

`JSScriptPluginWrapper` provides the `script` property (the JS source read from the classpath via `sourcePath`) and the `instance` property (the JS plugin object, a `Node`). It implements `JSPluginWrapper` which is both a `RuntimePlugin` and `NodeWrapper`.

---

## Plugin Lifecycle

Plugins are applied in a specific order during `HeadlessPlayer` initialization:

1. **`LoggerPlugin`** — Collected first. Explicit instances are merged with any ServiceLoader-discovered loggers and wired into `JSPlayerConfig` so JS `console.*` calls forward to them.
2. **`RuntimePlugin`** — Applied to the JS `Runtime`. JS bundles are loaded and plugin instances are created.
3. **`JSPluginWrapper` / `JSScriptPluginWrapper`** — These are `RuntimePlugin`s; their JS bundles are loaded during step 2. They are also passed to the JS Player constructor as part of its config.
4. **`PlayerPlugin`** — Applied to the JVM `Player` after the JS player is constructed. Can tap into player hooks.

Plugins implementing only the base `Plugin` marker interface are never `apply`'d by `HeadlessPlayer` but remain in the `plugins` list for `findPlugin()` discovery.

All plugin types are passed as a single `List<Plugin>` to `HeadlessPlayer`. The internals filter and apply each type at the appropriate stage.

---

## Creating and Starting a Player

`Player` is an abstract class. Use `HeadlessPlayer` to create an instance:

```kotlin
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.HeadlessPlayer
import com.intuit.playerui.core.player.state.CompletedState
import com.intuit.playerui.core.player.state.inProgressState

@OptIn(ExperimentalPlayerApi::class)
val player = HeadlessPlayer(
    plugins = listOf(<PluginName>())
)

// start() returns Completable<CompletedState> — the flow runs asynchronously
val completable = player.start(flowJsonString)

// Option 1: Subscribe to the result
completable.onComplete { result ->
    result.onSuccess { completedState ->
        val data = completedState.data        // JsonElement — serialized data model
        val endState = completedState.endState // NavigationFlowEndState
    }
    result.onFailure { error ->
        // Handle error
    }
}

// Option 2: Suspend and await the result
suspend fun runFlow() {
    val completedState = player.start(flowJsonString).await()
    println("Flow ended: ${completedState.endState.outcome}")
}

// Option 3: Collect as a kotlinx.coroutines Flow
suspend fun collectFlow() {
    player.start(flowJsonString).asFlow().collect { completedState ->
        println("Flow ended: ${completedState.endState.outcome}")
    }
}
```

### Accessing Player State

```kotlin
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.CompletedState
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.core.player.state.NotStartedState
import com.intuit.playerui.core.player.state.currentFlowState
import com.intuit.playerui.core.player.state.currentView
import com.intuit.playerui.core.player.state.dataModel
import com.intuit.playerui.core.player.state.lastViewUpdate
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.player.state.completedState
import com.intuit.playerui.core.player.state.errorState
import com.intuit.playerui.core.player.state.notStartedState

// Direct state check
val state = player.state
when (state) {
    is InProgressState -> {
        // InProgressState delegates Transition and ExpressionEvaluator,
        // so you can call state.transition("Next") directly.
        state.transition("Next")
        state.evaluate(listOf("@[someExpression]"))

        // Or access controllers individually:
        state.controllers.data    // DataController
        state.controllers.flow    // FlowController
        state.controllers.view    // ViewController
        state.controllers.expression // ExpressionController

        // Convenience extensions:
        state.currentView         // View? — the currently rendered view
        state.lastViewUpdate      // Asset? — the last resolved view asset
        state.currentFlowState    // NamedState? — current flow state-machine state
        state.dataModel           // DataController shorthand
    }
    is CompletedState -> {
        state.endState.outcome    // String — e.g., "DONE"
        state.data                // JsonElement — serialized data model
        state.dataModel           // DataModelWithParser — structured data access
    }
    is ErrorState -> {
        state.error               // PlayerException
    }
}

// Convenience extensions on Player
val notStarted: NotStartedState? = player.notStartedState
val inProgress: InProgressState? = player.inProgressState
val completed: CompletedState? = player.completedState
val errored: ErrorState? = player.errorState
```

### Releasing a Player

Always release the player when done to free runtime resources:

```kotlin
player.release()
```

After release, the player enters `ReleasedState` and cannot start new flows.

---

## Player Hooks Reference

All top-level hooks are accessible via `player.hooks` and are `NodeSyncHook1<T>`:

| Hook                   | Type                                  | Purpose                                                                         |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------- |
| `state`                | `NodeSyncHook1<out PlayerFlowState>`  | State transitions — check for `InProgressState`, `ErrorState`, `CompletedState` |
| `flowController`       | `NodeSyncHook1<FlowController>`       | Navigation and flow transitions                                                 |
| `viewController`       | `NodeSyncHook1<ViewController>`       | View lifecycle and updates                                                      |
| `view`                 | `NodeSyncHook1<View>`                 | Each new view (shortcut for `viewController.hooks.view`)                        |
| `expressionEvaluator`  | `NodeSyncHook1<ExpressionController>` | Register custom expression functions                                            |
| `dataController`       | `NodeSyncHook1<DataController>`       | Intercept data get/set operations                                               |
| `validationController` | `NodeSyncHook1<ValidationController>` | Add custom validators                                                           |
| `onStart`              | `NodeSyncHook1<Flow>`                 | Runs before a flow begins                                                       |

All hooks support `tap(name) { ... }` (named) and `tap { ... }` (anonymous). The callback receives nullable parameters since values cross the JS bridge.

---

## Coroutine Integration

`Player` exposes a `CoroutineScope` tied to its lifecycle. Use it to launch work that should be cancelled when the player is released:

```kotlin
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.subScope
import com.intuit.playerui.core.plugins.PlayerPlugin
import kotlinx.coroutines.launch

class <PluginName> : PlayerPlugin {

    @OptIn(ExperimentalPlayerApi::class)
    override fun apply(player: Player) {
        // player.scope — cancelled when the player is released
        player.scope.launch {
            // Long-running work tied to the player lifecycle
        }

        // player.subScope() — child scope with its own SupervisorJob.
        // Inherits the dispatcher and exception handler but can be
        // cancelled independently without affecting the parent.
        val childScope = player.subScope()
    }
}
```

For per-flow scoping (a new scope per `InProgressState`, cancelled on state change), use `FlowScopePlugin` from `com.intuit.playerui.plugins.coroutines`:

```kotlin
import com.intuit.playerui.plugins.coroutines.FlowScopePlugin

val flowScopePlugin = FlowScopePlugin()
val player = HeadlessPlayer(plugins = listOf(flowScopePlugin, myPlugin))

// After starting a flow:
flowScopePlugin.flowScope?.launch {
    // Work scoped to the current flow — cancelled on state transitions
}
```

---

## Testing

### Using `PlayerTest` Base Class

The recommended approach for testing JVM plugins uses `PlayerTest` from the test utilities module. It extends `RuntimeTest`, which enables `@TestTemplate` to run each test against every runtime on the classpath (J2V8, Hermes, GraalJS):

```kotlin
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.inProgressState
import com.intuit.playerui.core.plugins.Plugin
import com.intuit.playerui.utils.test.PlayerTest
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.TestTemplate

internal class <PluginName>Test : PlayerTest() {

    override val plugins: List<Plugin> by lazy {
        listOf(<PluginName>())
    }

    @TestTemplate
    fun `plugin applies to player`() {
        assertNotNull(player)
    }

    @TestTemplate
    fun `plugin applies and flow starts`() {
        player.start(simpleFlowString)

        val state = player.inProgressState
        assertNotNull(state)
    }

    @TestTemplate
    fun `plugin is retrievable from player`() {
        val found: <PluginName>? = player.findPlugin()
        assertNotNull(found)
    }
}
```

`PlayerTest` provides:

- `player` — a `HeadlessPlayer` instance, rebuilt before each test with your `plugins`
- `runtime` — the JS `Runtime` for the current test template iteration
- `simpleFlowString` — a basic flow JSON string for testing
- `@TestTemplate` — runs the test once per available runtime

### Using `RuntimePluginTest` for JS-Backed Plugins

For testing `JSScriptPluginWrapper` subclasses without a full Player:

```kotlin
import com.intuit.playerui.utils.test.RuntimePluginTest
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.TestTemplate

internal class <PluginName>Test : RuntimePluginTest<<PluginName>>() {

    override fun buildPlugin() = <PluginName>()

    @TestTemplate
    fun `plugin hooks are initialized`() {
        assertNotNull(plugin.hooks)
    }

    @TestTemplate
    fun `plugin method works`() {
        val result = plugin.someMethod("test-id")
        assertNotNull(result)
    }
}
```

`RuntimePluginTest` provides:

- `plugin` — your plugin instance, applied to a runtime before each test
- `runtime` — the JS `Runtime`
- `setupPlugin(plugin)` — re-initialize with a different plugin instance

### Standalone Test (No Base Class)

For simpler tests or when using a different test framework:

```kotlin
import com.intuit.playerui.core.experimental.ExperimentalPlayerApi
import com.intuit.playerui.core.player.HeadlessPlayer
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.inProgressState
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test

@OptIn(ExperimentalPlayerApi::class)
class <PluginName>Test {

    @Test
    fun `plugin initializes correctly`() {
        val plugin = <PluginName>()
        val player = HeadlessPlayer(plugin)

        player.start("""{ "id": "test-flow", "views": [{ "id": "view-1", "type": "info" }], "navigation": { "BEGIN": "FLOW_1", "FLOW_1": { "startState": "VIEW_1", "VIEW_1": { "state_type": "VIEW", "ref": "view-1", "transitions": {} } } } }""")

        val state = player.inProgressState
        assertNotNull(state)

        player.release()
    }
}
```

**Testing tips:**

- Use `@TestTemplate` (not `@Test`) with `PlayerTest`/`RuntimePluginTest` to run against all available runtimes.
- Tap hooks **before** calling `player.start()` to capture controller references.
- Use `player.inProgressState` extension to safely check if the player is in progress.
- Call `player.release()` in standalone tests to clean up runtime resources.
- Use `runBlockingTest` from `com.intuit.playerui.utils.test` for suspend-aware tests.

---

## Bridging JS Hooks to Kotlin (NodeSerializableField)

When wrapping a JS plugin, use `NodeSerializableField` to lazily deserialize JS object properties into Kotlin types:

```kotlin
@Serializable(Hooks.Serializer::class)
class Hooks internal constructor(override val node: Node) : NodeWrapper {
    // Sync hook with one argument
    val onEvent: NodeSyncHook1<String>
        by NodeSerializableField(NodeSyncHook1.serializer(String.serializer()))

    // Async waterfall hook with two arguments
    val buildData: NodeAsyncWaterfallHook2<Any?, EventArgs>
        by NodeSerializableField(NodeAsyncWaterfallHook2.serializer(GenericSerializer(), EventArgs.serializer()))

    // Sync bail hook
    val cancelEvent: NodeSyncBailHook1<EventArgs, Boolean>
        by NodeSerializableField(NodeSyncBailHook1.serializer(EventArgs.serializer(), Boolean.serializer()))

    internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
}
```

`NodeSerializableField` is a property delegate that reads from the underlying JS `Node` and deserializes on first access. It uses the property name as the JS key by default.

---

## Calling JS Methods from Kotlin

Use `getInvokable` to call methods on the JS plugin instance:

```kotlin
class <PluginName> : JSScriptPluginWrapper(PLUGIN_NAME, sourcePath = BUNDLED_SOURCE_PATH) {

    fun getAsset(id: String): Asset? =
        instance.getInvokable<Any?>("getAsset")?.invoke(id) as? Asset

    fun fireEvent(action: String, data: Map<String, Any?>) {
        instance.getInvokable<Any?>("fireEvent")?.invoke(
            mapOf("action" to action, "data" to data)
        )
    }

    // ...
}
```

---

## Key Types Reference

| Kotlin Type                     | Purpose                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `Plugin`                        | Base marker interface for all plugin types                                                                 |
| `RuntimePlugin`                 | Configures the JS runtime before player initialization; `apply(runtime: Runtime<*>)`                       |
| `PlayerPlugin`                  | JVM-level plugin; `apply(player: Player)` for hook access                                                  |
| `LoggerPlugin`                  | Extends `PlayerPlugin` with `trace`/`debug`/`info`/`warn`/`error` logging methods                          |
| `JSScriptPluginWrapper`         | Base for JS-backed plugins; handles script loading and instance creation                                   |
| `JSPluginWrapper`               | Interface combining `RuntimePlugin` + `NodeWrapper`; supports Kotlin delegation                            |
| `Pluggable`                     | Interface for constructs configurable via plugins; provides `findPlugin()`                                 |
| `HeadlessPlayer`                | Concrete `Player` implementation — the class you instantiate                                               |
| `Completable<T>`                | Async result from `player.start()`; supports `await()`, `onComplete()`, and `asFlow()`                     |
| `NodeWrapper`                   | Wraps a JS object `Node` for Kotlin access                                                                 |
| `NodeSerializableField`         | Property delegate for deserializing JS object fields                                                       |
| `NodeSyncHook1<T>`              | Wraps a JS SyncHook with one argument                                                                      |
| `NodeSyncHook2<T1, T2>`         | Wraps a JS SyncHook with two arguments                                                                     |
| `NodeSyncBailHook1<T, R>`       | Wraps a JS SyncBailHook — can short-circuit with `BailResult`                                              |
| `NodeSyncWaterfallHook1<T>`     | Wraps a JS SyncWaterfallHook — return value flows to next tap                                              |
| `NodeAsyncWaterfallHook2<T, U>` | Wraps an async waterfall hook with two arguments                                                           |
| `NotStartedState`               | Initial player state before any flow is started                                                            |
| `InProgressState`               | Active flow state — implements `Transition` and `ExpressionEvaluator`; access via `player.inProgressState` |
| `CompletedState`                | Terminal state with `endState: NavigationFlowEndState` and `data: JsonElement`                             |
| `ErrorState`                    | Terminal state with `error: PlayerException`                                                               |
| `ReleasedState`                 | Terminal state after `player.release()` — no further flows can start                                       |
| `ControllerState`               | Bundles `data`, `view`, `validation`, `expression`, and `flow` controllers                                 |
| `Transition`                    | Interface for `transition(state, options?)` — delegated by `InProgressState`                               |
| `ExpressionEvaluator`           | Interface for `evaluate(expressions)` — delegated by `InProgressState`                                     |
| `Runtime<*>`                    | JavaScript runtime abstraction (Hermes, J2V8, GraalJS)                                                     |
