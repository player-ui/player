# Package: @player-ui/jvm-core

## Overview

JVM/Kotlin bridge to headless Player UI runtime. Wraps the core JS Player engine within an embedded runtime (J2V8 or Hermes), exposing type-safe Kotlin APIs for executing Player flows. Designed for Android and JVM applications — executes the bundled `@player-ui/player` package internally, providing controllers, plugin hooks, and coroutine-based async primitives for seamless integration.

## Core Concepts

### HeadlessPlayer & State Machine

Primary entry point and orchestrator for flow execution. `HeadlessPlayer` is a concrete implementation of the abstract `Player` class, wrapping a JS Player instance in an embedded runtime.

**Lifecycle States** (sealed class hierarchy):

| State             | Description                          | Controller Access             |
| ----------------- | ------------------------------------ | ----------------------------- |
| `NotStartedState` | Initial state before any flow starts | None                          |
| `InProgressState` | Active flow execution                | Full access via `controllers` |
| `CompletedState`  | Flow finished successfully           | Read-only data access         |
| `ErrorState`      | Flow failed with exception           | None                          |
| `ReleasedState`   | Terminal state after `release()`     | None                          |

**Critical mental model:** Controllers only exist during `InProgressState`. Check `state is InProgressState` before accessing `controllers.data`, `controllers.flow`, etc. Attempting to access controllers in other states throws exceptions or returns null.

**Resource management:** HeadlessPlayer owns a CoroutineScope and embedded runtime. Always call `release()` when done to free native resources. The player is NOT thread-safe by default — serialize concurrent access or use a single-threaded dispatcher.

### Bridge Layer (Node/NodeWrapper/Completable)

JVM-JS boundary abstraction enabling typed access to JS objects.

**Node:** Opaque reference to a JS object living in the embedded runtime. Cannot directly access properties — use serializers or delegates.

**NodeWrapper:** Kotlin interface exposing `val node: Node`. Almost all Player APIs implement NodeWrapper — they're thin Kotlin facades delegating to underlying JS implementations. Common pattern:

```kotlin
interface DataController : NodeWrapper {
    val node: Node  // References JS DataController object
    fun get(binding: String): Any?  // Delegates to JS via node
}
```

Use `NodeSerializableField` and `NodeSerializableFunction` delegates to access Node properties type-safely.

**Completable<T>:** Async result wrapper with three consumption models:

1. **Coroutine:** `val result = completable.await()` (suspending)
2. **Flow:** `completable.asFlow().collect { result -> ... }`
3. **Callback:** `completable.onComplete { result: Result<T> -> ... }`

Completable is **cold** — doesn't start execution until consumed. Multiple subscriptions allowed. Differs from JS Promise semantics (no automatic chaining, explicit consumption required).

**Promise:** Wraps JS promises from the runtime. Convert to Completable via `toCompletable(serializer)` for JVM-friendly async handling.

### Controllers

Five specialized controllers manage flow execution (accessible via `InProgressState.controllers`):

**DataController:** Read/write data model using binding strings. Bindings are dot-separated paths like `"user.name"`, `"items[0].title"`. Methods:

- `get(binding: String): Any?`
- `set(transactions: Map<String, Any?>)`

**FlowController:** Navigate the state machine. Exposes current `FlowInstance` and transition methods. Access current state via `flow.current?.currentState`.

**ViewController:** Manage view lifecycle. Access current rendered view via `currentView` property (returns `View?`).

**ValidationController:** Trigger and query validations. Typically used before transitions to ensure data validity.

**ExpressionController:** Evaluate Player expressions programmatically. Delegates to JS expression evaluator.

Access pattern (safe casting):

```kotlin
val state = player.state
if (state is InProgressState) {
    val data = state.controllers.data
    data.set(mapOf("user.age" to 30))
}
```

### Plugin System

Three plugin types for extensibility:

**RuntimePlugin:** Modify the JS runtime before Player instantiation. Use for injecting globals, configuring runtime behavior, or adding native bindings.

**JSPluginWrapper:** Pass a JS plugin object to the Player constructor. Wraps existing JS plugins (from `@player-ui/` packages) for use in JVM.

**PlayerPlugin:** Tap into Player hooks after instantiation. Primary extension mechanism. Implement `apply(player: Player)` to register hook listeners.

**Application order** (during HeadlessPlayer construction):

1. RuntimePlugin instances applied first
2. JSPluginWrapper instances passed to JS Player config
3. PlayerPlugin instances applied last (can tap all hooks)

Plugin order matters — earlier plugins can influence later ones via hook execution order.

### Hook System

Extension mechanism based on `@intuit/hooks` library (Tapable pattern). Player exposes lifecycle hooks for observation and interception.

**Player-level hooks** (`player.hooks`):

- `state` — Fires on state transitions (NotStarted → InProgress → Completed/Error/Released)
- `flowController` — New FlowController created
- `dataController` — New DataController created
- `viewController` — ViewController created or updated
- `view` — New View resolved
- `expressionEvaluator` — ExpressionEvaluator created
- `validationController` — ValidationController created
- `onStart` — Flow started
- `onEnd` — Flow ended (Completed or Error)

**Controller-specific hooks:** Access via chaining. Example:

```kotlin
player.hooks.dataController.tap("my-plugin") { dataController ->
    dataController.hooks.onUpdate.tap("my-plugin") { updates ->
        // React to data changes
    }
}
```

Tap syntax: `hook.tap(name: String, callback)` — name used for debugging.

## API Surface

### Player Class

**Constructor:**

```kotlin
HeadlessPlayer(
    plugins: List<Plugin>,
    config: PlayerRuntimeConfig = PlayerRuntimeConfig()
)
```

**Key Methods:**

- `start(flow: String): Completable<CompletedState>` — Execute flow JSON string, returns async result
- `release()` — Free runtime resources, transition to ReleasedState (terminal)

**Key Properties:**

- `state: PlayerFlowState` — Current lifecycle state (read-only)
- `hooks: Player.Hooks` — Hook system access
- `scope: CoroutineScope` — Coroutine scope tied to player lifecycle
- `logger: TapableLogger` — Logging interface

### Controllers (via InProgressState.controllers)

**DataController:**

- `get(binding: String): Any?` — Read data at binding path
- `set(transactions: Map<String, Any?>)` — Write data (batch updates)
- `set(transactions: List<List<Any?>>)` — Alternative transaction format

**FlowController:**

- `transition(stateName: String)` — Navigate to named state
- `current: FlowInstance?` — Current flow instance with hooks

**ViewController:**

- `currentView: View?` — Currently rendered view

**ValidationController:**

- `validate(options: ValidationProviderOptions?): ValidationResponse` — Trigger validation

**ExpressionController:**

- `evaluate(expression: String): Any?` — Evaluate expression synchronously

### Bridge Types

**Completable<T>:**

- `suspend fun await(): T`
- `suspend fun asFlow(): Flow<T>`
- `fun onComplete(block: (Result<T>) -> Unit)`

**NodeWrapper:**

- `val node: Node` — Reference to underlying JS object

**Promise:**

- `toCompletable(serializer: KSerializer<T>): Completable<T?>` — Convert to Completable

### Plugin Interfaces

**Plugin:** Marker interface for all plugin types

**PlayerPlugin:**

```kotlin
interface PlayerPlugin : Plugin {
    fun apply(player: Player)
}
```

**RuntimePlugin:**

```kotlin
interface RuntimePlugin : Plugin {
    fun apply(runtime: Runtime<*>)
}
```

**JSPluginWrapper:** Wraps JS plugin Node (auto-applied to JS Player config)

### Hook Types

**NodeSyncHook1<T>:**

- `tap(name: String, callback: (T) -> Unit)`
- `call(arg: T)` — Trigger hook

## Common Usage Patterns

### Starting a Flow

**When:** Initial flow execution from JSON string

**Approach:**

1. Construct HeadlessPlayer with desired plugins
2. Call `start(flowJson)` with Flow JSON string
3. Consume the returned `Completable<CompletedState>` via `await()`, `asFlow()`, or `onComplete()`
4. Access controllers during InProgressState via state hook

**Considerations:**

- `start()` is non-blocking — flow executes asynchronously
- Controllers unavailable until state transitions to InProgressState
- Use coroutine context for `await()` (suspending function)
- Multiple flows can be started sequentially (previous must complete first)

**Example pattern:**

```kotlin
val player = HeadlessPlayer(listOf(myPlugin))
player.hooks.state.tap("app") { state ->
    if (state is InProgressState) {
        // Access state.controllers.data, .flow, etc.
    }
}
val result = player.start(flowJson).await()
player.release()
```

### Accessing Data

**When:** Reading or writing to the data model during flow execution

**Approach:**

1. Ensure state is InProgressState (check via type check or safe cast)
2. Get DataController: `state.controllers.data`
3. Use binding strings for get/set: `data.get("user.name")`, `data.set(mapOf("user.age" to 30))`
4. Bindings support nested paths (`"person.address.zip"`) and array indices (`"items[0]"`)

**Considerations:**

- Bindings are strings, not Kotlin property references — typos won't be caught at compile time
- `set()` accepts Map for single updates or List<List<Any?>> for transactions
- Data changes trigger view updates automatically (reactive binding)
- Invalid bindings return null for get, silently fail for set

**Example pattern:**

```kotlin
val state = player.state as? InProgressState ?: return
val data = state.controllers.data
val name = data.get("user.name") as? String
data.set(mapOf(
    "user.age" to 30,
    "user.verified" to true
))
```

### Creating Plugins

**When:** Extending Player behavior (logging, analytics, custom validators, data middleware)

**Approach:**

1. Implement `PlayerPlugin` interface
2. Override `apply(player: Player)` method
3. Tap into desired hooks to observe or modify behavior
4. Pass plugin to HeadlessPlayer constructor

**Considerations:**

- Plugin order matters — earlier plugins execute taps first
- Hook taps run synchronously — avoid blocking operations
- Use unique tap names for debugging (logged in hook traces)
- RuntimePlugin applied before PlayerPlugin (if you need runtime-level access)

**Example pattern:**

```kotlin
class AnalyticsPlugin : PlayerPlugin {
    override fun apply(player: Player) {
        player.hooks.state.tap("analytics") { state ->
            when (state) {
                is InProgressState -> logFlowStart()
                is CompletedState -> logFlowComplete(state.endState)
                is ErrorState -> logFlowError(state.error)
            }
        }
    }
}

val player = HeadlessPlayer(listOf(AnalyticsPlugin()))
```

### Async Handling with Completable

**When:** Waiting for flow completion or handling async operations

**Approach:**

1. Choose consumption model based on context:
   - Coroutine: `launch { completable.await() }` (cleanest for structured concurrency)
   - Flow: `completable.asFlow().collect { ... }` (for reactive streams)
   - Callback: `completable.onComplete { result -> ... }` (for callback-based code)
2. Handle `Result<T>` in callbacks (success or failure)
3. Use appropriate dispatcher (avoid blocking main thread on Android)

**Considerations:**

- Completable is cold — doesn't start until consumed (unlike hot observables)
- `await()` throws on failure — wrap in try-catch or use `Result<T>` handling
- Multiple subscriptions allowed (each gets same result)
- Flow completion signals end of flow execution

**Example pattern:**

```kotlin
// Coroutine approach
viewModelScope.launch {
    try {
        val result = player.start(flowJson).await()
        handleSuccess(result)
    } catch (e: Exception) {
        handleError(e)
    } finally {
        player.release()
    }
}

// Callback approach
player.start(flowJson).onComplete { result ->
    result.onSuccess { completed -> handleSuccess(completed) }
    result.onFailure { error -> handleError(error) }
}
```

### Resource Management

**When:** Application shutdown, fragment/activity lifecycle, or player no longer needed

**Approach:**

1. Await any in-progress flows (or cancel via scope)
2. Call `player.release()`
3. Do not access Player APIs after release (throws or returns ReleasedState)
4. Use try-finally or structured concurrency to ensure release

**Considerations:**

- Release frees embedded runtime (native resources) — GC alone won't reclaim
- Embedded runtimes hold ~5-10MB native memory — leaks accumulate across instances
- Accessing Node-backed objects after release causes errors (Node invalidated)
- Player.scope cancels on release — any launched coroutines terminate

**Example pattern:**

```kotlin
// Try-finally pattern
val player = HeadlessPlayer(plugins)
try {
    player.start(flowJson).await()
} finally {
    player.release()
}

// Android lifecycle-aware
class FlowViewModel : ViewModel() {
    private val player = HeadlessPlayer(plugins)

    fun executeFlow(json: String) {
        viewModelScope.launch {
            player.start(json).await()
        }
    }

    override fun onCleared() {
        player.release()
        super.onCleared()
    }
}
```

## Dependencies

- **kotlinx-coroutines-core**: Async operations, CoroutineScope management, Flow support. Player's async APIs built on coroutines (suspend functions, Completable).

- **kotlinx-serialization-json**: JSON parsing for Flow content, data model serialization/deserialization, Node bridge serialization.

- **com.intuit.hooks:hooks**: Hook system implementation (Tapable pattern). Provides SyncHook, tap/call mechanisms for plugin extensibility.

- **@player-ui/player** (bundled): Core Player engine JavaScript bundle. Embedded in JAR, loaded into runtime at initialization. Player is a facade over this JS implementation.

- **Embedded runtime** (J2V8 or Hermes): JavaScript execution engine loaded via service loader. Not a direct dependency — runtime implementation selected at runtime based on classpath.

## Integration Points

### Plugin System

Three extension levels:

- **RuntimePlugin**: Lowest level — modify JS runtime before Player creation. Use for native bindings, global injection, or runtime configuration.
- **JSPluginWrapper**: Pass JS plugins to Player constructor. Bridge existing `@player-ui/*` plugins into JVM.
- **PlayerPlugin**: Highest level — tap hooks after Player instantiation. Primary mechanism for custom logic.

Applied during HeadlessPlayer construction in order: RuntimePlugin → JSPluginWrapper → PlayerPlugin.

### Hook System

Player exposes 8+ lifecycle hooks via `player.hooks`. Controllers expose additional hooks (DataController.onUpdate, FlowController.flow, etc.). Tap hooks in PlayerPlugin.apply() to observe or modify behavior.

Hook tapping pattern:

```kotlin
player.hooks.controllerName.tap("plugin-name") { controller ->
    controller.hooks.eventName.tap("plugin-name") { event ->
        // Handle event
    }
}
```

### Bridge Layer

Extend NodeWrapper to wrap custom JS objects. Use NodeSerializableField/NodeSerializableFunction delegates for type-safe property access. Implement custom KSerializer instances for complex type mappings.

### CoroutineScope

Player provides `player.scope` tied to flow lifecycle. Use for flow-scoped coroutines that should cancel when flow completes or player releases. Scope uses SupervisorJob — individual child failures don't cancel entire scope.

### Logging

TapableLogger discovered via service loader (LoggerPlugin implementations). Tap logger hooks for custom log routing. Default console logger included if no explicit logger provided.

## Common Pitfalls

### 1. Accessing Controllers Before InProgressState

**Mistake:** Calling `player.state.controllers.data` when state is NotStartedState or ReleasedState

**Why it happens:** Controllers don't exist until flow starts. Attempting to access throws NullPointerException or returns null.

**Fix:** Check state type before accessing:

```kotlin
val state = player.state
if (state is InProgressState) {
    val data = state.controllers.data
    // Safe to use data here
}
```

Or use safe cast: `(player.state as? InProgressState)?.controllers?.data`

### 2. Blocking Main Thread

**Mistake:** Calling `player.start(flow).await()` from Android main thread without coroutine dispatcher

**Why it happens:** `await()` is suspending, but if called from main thread runBlocking or similar, blocks UI thread causing ANR (Application Not Responding).

**Fix:** Use appropriate dispatcher:

```kotlin
viewModelScope.launch(Dispatchers.Default) {
    player.start(flow).await()
}
```

Player logs warnings when runtime accessed from main thread. Use Dispatchers.Main.immediate only for UI updates, not flow execution.

### 3. Node Invalidation After State Transition

**Mistake:** Storing controller reference across flows:

```kotlin
val data = (player.state as InProgressState).controllers.data
player.start(newFlow).await()
data.set(mapOf("key" to "value")) // Crashes — Node invalidated
```

**Why it happens:** Node references tied to JS object lifecycle. When flow ends (state transitions to Completed/Error), underlying JS objects released.

**Fix:** Get fresh controller reference per flow. Don't store controllers — access via `player.state` each time.

### 4. Resource Leaks (Not Calling release())

**Mistake:** Letting HeadlessPlayer be garbage collected without calling `release()`

**Why it happens:** Embedded runtime holds native resources (memory, threads). GC finalizer may not run promptly, leaking ~5-10MB per player instance.

**Fix:** Always call release in finally block:

```kotlin
val player = HeadlessPlayer(plugins)
try {
    player.start(flow).await()
} finally {
    player.release()
}
```

Android: Release in ViewModel.onCleared() or lifecycle observer.

### 5. Plugin Ordering Issues

**Mistake:** Plugin A depends on Plugin B's hook tap, but A listed before B in plugin list. Hook execution order causes A to miss B's setup.

**Why it happens:** Plugins applied sequentially during construction. Hook taps execute in registration order.

**Fix:** Order plugins by dependency. Place RuntimePlugin implementations first, JSPluginWrapper next, PlayerPlugin last. Within each category, place dependent plugins after their dependencies.

### 6. Completable Not Consumed

**Mistake:** `player.start(flow)` without `await()`, `asFlow()`, or `onComplete()` — flow appears to not start

**Why it happens:** Completable is cold — doesn't begin execution until consumed. Simply calling `start()` doesn't trigger flow.

**Fix:** Always consume Completable:

```kotlin
player.start(flow).await()                // Coroutine
player.start(flow).onComplete { ... }      // Callback
player.start(flow).asFlow().collect { }    // Flow
```

### 7. Thread-Safety Assumptions

**Mistake:** Calling Player methods from multiple threads concurrently without synchronization

**Why it happens:** JS runtime not thread-safe. Player doesn't synchronize access. Concurrent calls cause undefined behavior or crashes.

**Fix:** Serialize Player access. Use single-threaded dispatcher or explicit synchronization:

```kotlin
val playerMutex = Mutex()
suspend fun safeStart(flow: String) = playerMutex.withLock {
    player.start(flow).await()
}
```

Or confine Player to single thread via `newSingleThreadContext()`.

## Reference Files

- `/jvm/core/src/main/kotlin/com/intuit/playerui/core/player/Player.kt` — Abstract Player interface
- `/jvm/core/src/main/kotlin/com/intuit/playerui/core/player/HeadlessPlayer.kt` — Concrete implementation, plugin application
- `/jvm/core/src/main/kotlin/com/intuit/playerui/core/player/state/PlayerFlowState.kt` — State machine definitions
- `/jvm/core/src/main/kotlin/com/intuit/playerui/core/bridge/Completable.kt` — Async result wrapper
- `/jvm/core/src/main/kotlin/com/intuit/playerui/core/bridge/NodeWrapper.kt` — Bridge pattern interface
- `/jvm/core/src/main/kotlin/com/intuit/playerui/core/data/DataController.kt` — Data model access
- `/jvm/core/src/main/kotlin/com/intuit/playerui/core/flow/FlowController.kt` — State machine navigation
- `/jvm/core/src/main/kotlin/com/intuit/playerui/core/plugins/PlayerPlugin.kt` — Plugin interface
- `/jvm/core/src/main/kotlin/com/intuit/playerui/core/logger/TapableLogger.kt` — Logging system
