---
name: Create Android Player Plugin (Kotlin)
description: Use when the user wants to create an Android plugin for Player UI in Kotlin. Covers AndroidPlayerPlugin for UI/asset registration, PlayerPlugin for JVM-level hooks, JS-backed plugins via JSScriptPluginWrapper, asset registration, plugin lifecycle, and testing. For the user's own Android project.
version: "1.0"
argument-hint: "[plugin-name e.g. analytics-tracker]"
---

# Create Android Player Plugin (Kotlin)

You are helping a developer create an Android/Kotlin plugin for Player UI in their own project. Android plugins extend the Player runtime with platform-specific behavior, register Android asset components, and integrate with `AndroidPlayer`.

**Before writing any code**, confirm the plugin name with the user. Use kebab-case for the module (e.g. `analytics-tracker`). The class name should be PascalCase (e.g. `AnalyticsTrackerPlugin`).

---

## Install Dependencies

Add to your module's `build.gradle.kts`:

```kotlin
dependencies {
    implementation("com.intuit.playerui:android:<version>")

    // If wrapping a JS-based core plugin:
    implementation("com.intuit.playerui:core:<version>")

    // For asset data classes:
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:<version>")

    // Jetpack Compose (for ComposableAsset-based assets):
    implementation("androidx.compose.material:material:<version>")

    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:<version>")
}
```

The JavaScript runtime (Hermes, J2V8, etc.) is an app-level dependency — plugins should not declare one. The consuming app chooses its runtime.

---

## Plugin Types

There are three approaches for Android plugins, each implementing a different interface. All extend the base `Plugin` marker interface.

### 1. AndroidPlayerPlugin (Android-Specific)

The primary interface for plugins that need access to `AndroidPlayer` — for registering assets, accessing Android-specific hooks, or using platform APIs. This is the most common type for Android plugins.

```kotlin
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayerPlugin

class <PluginName> : AndroidPlayerPlugin {
    val name = "<PluginName>"

    override fun apply(androidPlayer: AndroidPlayer) {
        // Register assets
        androidPlayer.registerAsset("my-asset", ::MyAsset)

        // Access player hooks through the backing player
        androidPlayer.player.hooks.state.tap(name) { state ->
            // React to state changes
        }

        // Access Android-specific hooks
        androidPlayer.hooks.update.tap(name) { asset ->
            // React to view updates
        }
    }
}
```

`AndroidPlayerPlugin` is applied **last** during initialization, after all JS and JVM plugins have been applied. This means the JS runtime is fully configured and player hooks are available.

### 2. PlayerPlugin (JVM-Only Hooks)

For plugins that only need JVM-level access to the Player hook system and do not need `AndroidPlayer` features like asset registration:

```kotlin
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.state.ErrorState
import com.intuit.playerui.core.plugins.PlayerPlugin

class <PluginName> : PlayerPlugin {
    val name = "<PluginName>"

    override fun apply(player: Player) {
        player.hooks.state.tap(name) { state ->
            if (state is ErrorState) {
                // Handle error
            }
        }

        player.hooks.flowController.tap(name) { fc ->
            // Access flow controller
        }
    }
}
```

The `AndroidPlayer` extends `Player`, so `AndroidPlayerPlugin` implementations already have access to everything `PlayerPlugin` provides through `androidPlayer.player`.

### 3. JS-Backed Plugin (Wrapping a Core TypeScript Plugin)

Loads a compiled JavaScript bundle and bridges hooks to Kotlin. Extend `JSScriptPluginWrapper`:

```kotlin
import com.intuit.playerui.core.bridge.Node
import com.intuit.playerui.core.bridge.NodeWrapper
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.bridge.runtime.ScriptContext
import com.intuit.playerui.core.bridge.serialization.serializers.NodeWrapperSerializer
import com.intuit.playerui.core.player.PlayerException
import com.intuit.playerui.core.plugins.JSScriptPluginWrapper
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
        internal object Serializer : NodeWrapperSerializer<Hooks>(::Hooks)
    }

    private companion object {
        private const val PLUGIN_NAME = "<PluginName>"
        private const val BUNDLED_SOURCE_PATH = "<PluginName>.native.js"
    }
}
```

The `.native.js` bundle must be on the classpath at runtime. Place it in `src/main/resources/`.

#### Combining JS + Android Behavior

When a plugin needs both JS-backed core behavior **and** Android-specific features (like asset registration), use Kotlin delegation to compose both interfaces:

```kotlin
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.android.AndroidPlayerPlugin
import com.intuit.playerui.core.plugins.JSPluginWrapper

class <PluginName> :
    AndroidPlayerPlugin,
    JSPluginWrapper by <CorePluginWrapper>() {

    override fun apply(androidPlayer: AndroidPlayer) {
        androidPlayer.registerAsset("my-asset", ::MyAsset)
    }
}
```

This pattern delegates JS runtime loading to the core plugin wrapper while the class itself handles Android-specific setup. See `ReferenceAssetsPlugin` in the Player repo for a real-world example.

---

## Asset Registration

The most common use of `AndroidPlayerPlugin` is registering asset types. Assets map flow JSON `type` values to Kotlin view implementations.

```kotlin
override fun apply(androidPlayer: AndroidPlayer) {
    androidPlayer.registerAsset("action", ::Action)
    androidPlayer.registerAsset("text", ::Text)
    androidPlayer.registerAsset("info", ::Info)
}
```

### Creating a Composable Asset

Modern Android assets use Jetpack Compose via `ComposableAsset<Data>`:

```kotlin
import androidx.compose.runtime.Composable
import com.intuit.playerui.android.AssetContext
import com.intuit.playerui.android.compose.ComposableAsset
import kotlinx.serialization.Serializable

class MyAsset(assetContext: AssetContext) : ComposableAsset<MyAsset.Data>(assetContext, Data.serializer()) {

    @Serializable
    data class Data(
        val label: String? = null,
    )

    @Composable
    override fun content(data: Data) {
        // Render Compose UI using the deserialized data
        data.label?.let { Text(text = it) }
    }
}
```

The `@Serializable` `Data` class is automatically deserialized from the flow JSON asset node.

---

## RuntimePlugin

`RuntimePlugin` adds non-player-specific functionality to the JS runtime before the player is initialized. Use this when your plugin depends on JS globals that may not exist in all runtimes (e.g. `setTimeout`):

```kotlin
import com.intuit.playerui.core.bridge.runtime.Runtime
import com.intuit.playerui.core.plugins.RuntimePlugin

class <PluginName> : RuntimePlugin {
    override fun apply(runtime: Runtime<*>) {
        // Add globals or configure the JS runtime
    }
}
```

`RuntimePlugin`s are applied **first**, before any JS player plugins or `PlayerPlugin`s.

---

## Available Player Hooks

### Player Hooks (JVM)

Accessible via `player.hooks` on any `Player` (including through `androidPlayer.player`):

| Hook                   | Type                                  | Purpose                                                                        |
| ---------------------- | ------------------------------------- | ------------------------------------------------------------------------------ |
| `state`                | `NodeSyncHook1<out PlayerFlowState>`  | State transitions; check for `InProgressState`, `ErrorState`, `CompletedState` |
| `flowController`       | `NodeSyncHook1<FlowController>`       | Navigation and flow transitions                                                |
| `viewController`       | `NodeSyncHook1<ViewController>`       | View lifecycle and updates                                                     |
| `view`                 | `NodeSyncHook1<View>`                 | Each new view rendered                                                         |
| `expressionEvaluator`  | `NodeSyncHook1<ExpressionController>` | Register custom expression functions                                           |
| `dataController`       | `NodeSyncHook1<DataController>`       | Intercept data get/set operations                                              |
| `validationController` | `NodeSyncHook1<ValidationController>` | Add custom validators                                                          |
| `onStart`              | `NodeSyncHook1<Flow>`                 | Runs before a flow begins                                                      |

### AndroidPlayer Hooks

Additional hooks on `AndroidPlayer.Hooks` (accessible via `androidPlayer.hooks`):

| Hook                             | Type                | Purpose                                            |
| -------------------------------- | ------------------- | -------------------------------------------------- |
| `context`                        | `SyncWaterfallHook` | Transform the Android `Context` used for rendering |
| `update`                         | `SyncBailHook`      | Intercept asset view updates                       |
| `compositionLocalProvidedValues` | `SyncHook`          | Provide Compose `CompositionLocal` values          |

---

## Plugin Lifecycle

Plugins are applied in a specific order during `AndroidPlayer` initialization:

1. **`RuntimePlugin`** — Applied to the JS `Runtime` first. Use for adding JS globals or runtime configuration.
2. **`JSPluginWrapper` / `JSScriptPluginWrapper`** — JS bundles are loaded and plugin instances are created in the runtime.
3. **`PlayerPlugin`** — Applied to the JVM `Player` wrapper. Can tap into player hooks.
4. **`AndroidPlayerPlugin`** — Applied to `AndroidPlayer` last. Full access to the configured player, hooks, and asset registry.

All plugin types are passed as a single `List<Plugin>` to `AndroidPlayer`. The internals filter and apply each type at the appropriate stage.

---

## Using the Plugin with AndroidPlayer

```kotlin
import com.intuit.playerui.android.AndroidPlayer

val player = AndroidPlayer(
    plugins = listOf(
        <PluginName>(),
        // ... other plugins
    )
)

// Start a flow
player.start(flowJsonString)
```

### Finding a Plugin on a Player Instance

Use the `findPlugin` extension to retrieve a registered plugin:

```kotlin
import com.intuit.playerui.core.plugins.findPlugin

val myPlugin: <PluginName>? = player.findPlugin()

// Or expose as a convenience extension property:
val Player.<camelCaseName>: <PluginName>? get() = findPlugin()
```

---

## Test File

### Unit Test

```kotlin
import com.intuit.playerui.core.player.Player
import com.intuit.playerui.core.player.state.InProgressState
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertTrue
import org.junit.Test

class <PluginName>Test {

    @Test
    fun `plugin initializes correctly`() {
        val plugin = <PluginName>()
        assertNotNull(plugin)
    }

    @Test
    fun `plugin applies to player`() {
        val plugin = <PluginName>()
        val player = AndroidPlayer(plugins = listOf(plugin))
        assertNotNull(player)
    }
}
```

### Instrumented Test (with AndroidPlayer)

```kotlin
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.intuit.playerui.android.AndroidPlayer
import com.intuit.playerui.core.player.state.InProgressState
import com.intuit.playerui.core.player.state.dataModel
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class <PluginName>InstrumentedTest {

    @Test
    fun plugin_registers_and_renders_asset() = runTest {
        val plugin = <PluginName>()
        val player = AndroidPlayer(plugins = listOf(plugin))

        player.start(flowJsonString)

        val state = player.state
        assertNotNull(state)
        assertTrue(state is InProgressState)
    }
}
```

**Testing tips:**

- Use `runTest` from `kotlinx-coroutines-test` for suspend-aware tests.
- Tap `player.hooks.state` **before** calling `player.start()` to capture state transitions.
- Check `player.state` for `InProgressState`, `CompletedState`, or `ErrorState` after starting a flow.
- For asset-level testing, extend `AssetTest` from the Player testutils module and use helpers like `shouldBeAsset<T>`, `shouldBeAtState<T>`, and `shouldBeView<T>`.

---

## Key Types Reference

| Kotlin Type             | Purpose                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| `Plugin`                | Base marker interface for all plugin types                                  |
| `AndroidPlayerPlugin`   | Primary interface for Android plugins; provides `apply(AndroidPlayer)`      |
| `PlayerPlugin`          | JVM-level plugin; provides `apply(Player)` for hook access                  |
| `RuntimePlugin`         | Configures the JS runtime before player initialization                      |
| `JSScriptPluginWrapper` | Base for plugins that wrap a compiled JavaScript bundle                     |
| `JSPluginWrapper`       | Interface for JS plugin wrappers; supports Kotlin delegation                |
| `AndroidPlayer`         | Android-specific Player with lifecycle, asset registry, and Compose support |
| `RenderableAsset`       | Base class for all renderable Android assets                                |
| `ComposableAsset<T>`    | Jetpack Compose asset base class with `@Serializable` data                  |
| `AssetContext`          | Context object passed to asset constructors during expansion                |
| `NodeWrapper`           | Wraps a JS object node for Kotlin access                                    |
| `NodeSyncHook1<T>`      | Wraps a JS SyncHook with one argument for Kotlin tapping                    |
| `Runtime<*>`            | JavaScript runtime abstraction (Hermes, J2V8, etc.)                         |
