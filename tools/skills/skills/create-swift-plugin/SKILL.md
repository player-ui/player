---
name: Create Swift/iOS Player Plugin
description: Use when the user wants to create a Swift/iOS plugin for Player UI. Covers pure Swift NativePlugin, JS-backed JSBasePlugin, SwiftUI hooks (view, transition), ManagedPlayerPlugin, cross-plugin discovery via WithSymbol/findPlugin, plugin lifecycle, and testing with HeadlessPlayerImpl. For the user's own iOS/Swift project.
version: "2.0"
argument-hint: "[plugin-name e.g. AnalyticsTracker]"
---

# Create Swift/iOS Player Plugin

You are helping a developer create a Swift plugin for Player UI in their own iOS project. iOS plugins extend the Player runtime with platform-specific behavior and can optionally wrap a TypeScript core plugin via JavaScriptCore.

**Before writing any code**, confirm the plugin name and whether it wraps an existing JS plugin or is pure Swift.

---

## Naming Conventions

| Concern                            | Convention                                        | Example                                           |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------- |
| Class name                         | PascalCase, ends in `Plugin`                      | `AnalyticsTrackerPlugin`                          |
| `pluginName` property              | String used as tap identifier                     | `"AnalyticsTrackerPlugin"`                        |
| SPM library name                   | `PlayerUI` + plugin name                          | `PlayerUIAnalyticsTrackerPlugin`                  |
| JS `fileName` (for JSBasePlugin)   | `"<PluginName>.native"` (no `.js`)                | `"AnalyticsTracker.native"`                       |
| JS `pluginName` (constructor path) | `"<Package>.<Class>"` — global path in JS context | `"AnalyticsTrackerPlugin.AnalyticsTrackerPlugin"` |
| CocoaPods bundle path              | `"PlayerUI_<PluginName>Plugin.bundle"`            | `"PlayerUI_AnalyticsTrackerPlugin.bundle"`        |

---

## Install Dependencies

### Swift Package Manager (primary)

In your `Package.swift`:

```swift
dependencies: [
    .package(url: "https://github.com/player-ui/playerui-swift-package.git", from: "<version>")
]
```

Then add `PlayerUI` (and `PlayerUISwiftUI` if building a SwiftUI plugin) to your target dependencies:

```swift
.target(
    name: "MyApp",
    dependencies: ["PlayerUI", "PlayerUISwiftUI"]
)
```

### CocoaPods

```ruby
pod 'PlayerUI'
```

---

## Plugin Types

### 1. Pure Swift Plugin (NativePlugin)

For custom behavior that doesn't need a JavaScript counterpart. Implement the `NativePlugin` protocol:

```swift
import PlayerUI

public class <PluginName>Plugin: NativePlugin {
    public var pluginName: String = "<PluginName>Plugin"

    public func apply<P: HeadlessPlayer>(player: P) {
        player.hooks?.state.tap { state in
            // React to state changes
        }

        player.hooks?.flowController.tap { fc in
            // Access flow controller
        }
    }
}
```

The `NativePlugin` protocol requires:

- **`pluginName: String`** — identifier used for tap registration
- **`apply<P: HeadlessPlayer>(player: P)`** — called after `setupPlayer`; a default no-op is provided by a protocol extension, so this is optional for plugins that only need JS-side behavior

**SwiftUI cast pattern:** Plugins that need SwiftUI-specific hooks must cast inside `apply`:

```swift
public func apply<P: HeadlessPlayer>(player: P) {
    guard let player = player as? SwiftUIPlayer else { return }
    player.hooks?.view.tap { view in
        // Wrap or modify the rendered view
        return view.environment(\.myCustomKey, myValue)
    }
}
```

### 2. JS-Backed Plugin (Wrapping a TypeScript Core Plugin)

Subclass `JSBasePlugin` and conform to `NativePlugin`. `JSBasePlugin` already provides `pluginName`, so you only need to redeclare it if you also need `NativePlugin` conformance:

```swift
import Foundation
import JavaScriptCore

#if SWIFT_PACKAGE
import PlayerUI
#endif

public class <PluginName>Plugin: JSBasePlugin, NativePlugin {

    public convenience init() {
        self.init(
            fileName: "<PluginName>Plugin.native",
            pluginName: "<PluginName>Plugin.<PluginName>Plugin"
        )
    }

    override public func getArguments() -> [Any] {
        // Return constructor arguments for the JS plugin
        return []
    }

    override public func setup(context: JSContext) {
        super.setup(context: context)
        guard let ref = pluginRef else { return }
        // Wire up Swift-accessible hooks from the JS plugin instance
    }

    override open func getUrlForFile(fileName: String) -> URL? {
        #if SWIFT_PACKAGE
        ResourceUtilities.urlForFile(name: fileName, ext: "js", bundle: Bundle.module)
        #else
        ResourceUtilities.urlForFile(
            name: fileName,
            ext: "js",
            bundle: Bundle(for: <PluginName>Plugin.self),
            pathComponent: "PlayerUI_<PluginName>Plugin.bundle"
        )
        #endif
    }
}
```

**Important:** The `.native.js` bundle must be included in your app's bundle resources.

Key `JSBasePlugin` overrides:

| Method                             | Purpose                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------- |
| `getArguments() -> [Any]`          | Constructor arguments passed to the JS plugin                                            |
| `setup(context: JSContext)`        | Called when `context` is set; call `super.setup` first, then wire hooks from `pluginRef` |
| `getUrlForFile(fileName:) -> URL?` | Bundle resolution for the `.js` file — override for external plugins                     |

---

## Plugin Lifecycle

Initialization happens in this order:

1. **`setupPlayer(context:plugins:)`** iterates plugins — for each `JSBasePlugin`, it sets `plugin.context = context`
2. Setting `context` triggers **`setup(context:)`** on the `JSBasePlugin`, which calls `getPlugin(...)` to construct the JS plugin from `fileName` + `pluginName` + `getArguments()`
3. The JS `Player` is constructed with an array of all `JSBasePlugin` instances' `pluginRef` values — pure `NativePlugin` types are **not** passed to the JS Player constructor
4. **`plugin.apply(player:)`** is called on every plugin (both `JSBasePlugin` + `NativePlugin` conformers)

```
setupPlayer(context:plugins:)
  │
  ├── for each JSBasePlugin: set context → setup(context:) → pluginRef created
  │
  ├── JS Player constructed with [pluginRef, ...]
  │
  └── for each NativePlugin: apply(player:) called
```

---

## Architecture: JS-Backed Plugins

```
┌──────────────────────────────────────────────────┐
│  Swift                                           │
│  <PluginName>Plugin: JSBasePlugin, NativePlugin  │
│    init(fileName:pluginName:)  ← JS bundle name  │
│    getArguments()              ← constructor args │
│    setup(context:)             ← hook wiring      │
│    apply(player:)              ← native hooks     │
└──────────────────────────────────────────────────┘
        ↕  JavaScriptCore
┌──────────────────────────────────────────────────┐
│  JavaScript  (<PluginName>Plugin.native.js)      │
│    constructor(args)  ← from getArguments()      │
│    hooks.*            ← bridged in setup()       │
└──────────────────────────────────────────────────┘
```

---

## Hooks Reference

### CoreHooks (available on all HeadlessPlayer implementations)

| Hook             | Type                       | Description                           |
| ---------------- | -------------------------- | ------------------------------------- |
| `flowController` | `Hook<FlowController>`     | Fired when the FlowController changes |
| `viewController` | `Hook<ViewController>`     | Fired when the ViewController changes |
| `dataController` | `Hook<DataControllerType>` | Fired when the DataController changes |
| `state`          | `Hook<BaseFlowState>`      | Fired when the player state changes   |
| `onStart`        | `Hook<FlowType>`           | Provides access to the current flow   |

### SwiftUI-Only Hooks (on `SwiftUIPlayer.hooks`)

| Hook         | Type                                       | Description                                           |
| ------------ | ------------------------------------------ | ----------------------------------------------------- |
| `view`       | `SyncWaterfallHook<AnyView>`               | Modify or wrap the rendered view before display       |
| `transition` | `SyncBailHook<Void, PlayerViewTransition>` | Provide transition animations between views in a flow |

### Hook Types for JS-Backed Plugins

Use these when bridging hooks from `pluginRef` in `setup(context:)`:

| Class                           | Parameters | Constraint                                                          | Use Case                             |
| ------------------------------- | ---------- | ------------------------------------------------------------------- | ------------------------------------ |
| `Hook<T>`                       | 1          | `T: CreatedFromJSValue`                                             | Standard single-value hook           |
| `Hook2<T, U>`                   | 2          | Both `CreatedFromJSValue`                                           | Two-parameter hook                   |
| `HookDecode<T>`                 | 1          | `T: Decodable`                                                      | Decoded single-value hook            |
| `Hook2Decode<T, U>`             | 2          | Both `Decodable`                                                    | Decoded two-parameter hook           |
| `Hook3Decode<T, U, S>`          | 3          | All `Decodable`                                                     | Decoded three-parameter hook         |
| `AsyncHook<T>`                  | 1          | `T: CreatedFromJSValue`                                             | Async hook returning a JS promise    |
| `AsyncHook2<T, U>`              | 2          | Both `CreatedFromJSValue`                                           | Async two-parameter hook             |
| `SyncWaterfallHookJS<T, R>`     | 1          | `T: CreatedFromJSValue`, `R: CreatedFromJSValue & JSValueProviding` | Waterfall hook (return value chains) |
| `SyncWaterfallHook2JS<T, R, U>` | 2          | Same as above                                                       | Two-arg waterfall hook               |

---

## Hook Access in JS-Backed Plugins

After `setup(context:)`, access JS hooks from `pluginRef`:

```swift
struct <PluginName>Hooks {
    let onEvent: Hook<JSValue>
}

// In setup(context:):
override public func setup(context: JSContext) {
    super.setup(context: context)
    guard let ref = pluginRef else { return }
    self.hooks = <PluginName>Hooks(
        onEvent: Hook<JSValue>(baseValue: ref, name: "onEvent")
    )
}

// Tap the hook externally:
plugin.hooks?.onEvent.tap { value in
    print("Event:", value)
}
```

For async hooks:

```swift
let onAsync: AsyncHook<JSValue>

onAsync = AsyncHook<JSValue>(baseValue: ref, name: "onAsyncEvent")

plugin.hooks?.onAsync.tap { value async throws -> JSValue? in
    // Perform async work
    return nil
}
```

---

## SwiftUI Plugin Patterns

### Tapping the View Hook

Wrap or inject environment values into the rendered view:

```swift
public func apply<P: HeadlessPlayer>(player: P) {
    guard let player = player as? SwiftUIPlayer else { return }
    player.hooks?.view.tap { view in
        return AnyView(view.environment(\.myKey, myValue))
    }
}
```

### ManagedPlayerPlugin

For plugins that need to interact with the `ManagedPlayer` lifecycle (loading states, flow transitions), conform to `ManagedPlayerPlugin`:

```swift
import PlayerUI
import PlayerUISwiftUI

public class <PluginName>Plugin: NativePlugin, ManagedPlayerPlugin {
    public var pluginName: String = "<PluginName>Plugin"

    // Called by ManagedPlayer upon instantiation, before SwiftUIPlayer is created
    public func apply(_ model: ManagedPlayerViewModel) {
        model.stateTransition.tap(name: pluginName) {
            // Return a transition for loading state changes
            .bail(PlayerViewTransition(transition: .opacity, animationCurve: .easeInOut))
        }
    }

    // Called after Player is set up
    public func apply<P: HeadlessPlayer>(player: P) {
        guard let player = player as? SwiftUIPlayer else { return }
        // Tap SwiftUI-specific hooks
    }
}
```

`ManagedPlayerPlugin.apply(_:)` is called at `ManagedPlayer` initialization, **before** the inner `SwiftUIPlayer` is created — use it for orchestrating loading state transitions.

---

## Cross-Plugin Discovery (WithSymbol / findPlugin)

When one plugin needs to find another plugin's JS instance at runtime, use the `WithSymbol` protocol and `findPlugin`:

```swift
// Plugin that exposes itself for discovery:
public class <PluginName>Plugin: JSBasePlugin, NativePlugin, WithSymbol {
    public static var symbol: String = "<PluginName>Plugin.<PluginName>PluginSymbol"

    // ...
}

// Another plugin finding it at runtime:
public class ConsumerPlugin: NativePlugin {
    public var pluginName: String = "ConsumerPlugin"

    public func apply<P: HeadlessPlayer>(player: P) {
        player.applyTo(<PluginName>Plugin.self) { pluginRef in
            // pluginRef is the JSValue of the found plugin
            pluginRef.invokeMethod("someMethod", withArguments: [])
        }
    }
}
```

For dynamic registration after player creation:

```swift
let newPlugin = SomeJSBasePlugin()
player.registerPlugin(newPlugin)
```

---

## Using the Plugin

### With SwiftUI

```swift
import PlayerUI
import PlayerUISwiftUI

struct ContentView: View {
    @State var result: Result<CompletedState, PlayerError>?

    var body: some View {
        SwiftUIPlayer(
            flow: flowString,
            plugins: [<PluginName>Plugin()],
            result: $result
        )
    }
}
```

### With ManagedPlayer

```swift
import PlayerUI
import PlayerUISwiftUI

struct ContentView: View {
    var body: some View {
        ManagedPlayer(
            plugins: [<PluginName>Plugin(), TransitionPlugin(popTransition: .pop)],
            flowManager: myFlowManager,
            onComplete: { result in
                // Handle final completion
            }
        )
    }
}
```

### Headless (No UI)

```swift
import PlayerUI

let player = HeadlessPlayerImpl(plugins: [<PluginName>Plugin()])
player.start(flow: flowJsonString) { result in
    switch result {
    case .success(let completedState):
        print("Flow completed:", completedState)
    case .failure(let error):
        print("Flow error:", error)
    }
}
```

---

## Test File

```swift
import XCTest
import JavaScriptCore
@testable import PlayerUI
@testable import PlayerUITestUtilitiesCore
@testable import PlayerUI<PluginName>Plugin

class <PluginName>PluginTests: XCTestCase {

    func testPluginAppliesWithFlow() {
        let flow = """
        {
          "id": "test-flow",
          "views": [
            {
              "id": "view-1",
              "type": "text",
              "value": "Hello"
            }
          ],
          "navigation": {
            "BEGIN": "FLOW_1",
            "FLOW_1": {
              "startState": "VIEW_1",
              "VIEW_1": {
                "ref": "view-1",
                "state_type": "VIEW",
                "transitions": {
                  "*": "END_Done"
                }
              }
            }
          }
        }
        """

        let expectation = XCTestExpectation(description: "flow completes")
        let plugin = <PluginName>Plugin()
        let player = HeadlessPlayerImpl(plugins: [plugin])

        player.start(flow: flow) { result in
            switch result {
            case .success:
                // Assert plugin behavior
                break
            case .failure(let error):
                XCTFail("Flow failed: \(error)")
            }
            expectation.fulfill()
        }

        wait(for: [expectation], timeout: 5)
    }

    func testPluginHookFires() {
        let expectation = XCTestExpectation(description: "hook callback called")
        let plugin = <PluginName>Plugin()
        let player = HeadlessPlayerImpl(plugins: [plugin])

        player.hooks?.state.tap { state in
            XCTAssertNotNil(state)
            expectation.fulfill()
        }

        player.start(flow: flowJson) { _ in }
        wait(for: [expectation], timeout: 3)
    }
}
```

### Testing Tips

- Use `HeadlessPlayerImpl(plugins:)` from `PlayerUITestUtilitiesCore` for headless tests
- Import with `@testable` to access internal members: `@testable import PlayerUI`, `@testable import PlayerUI<PluginName>Plugin`
- Use `XCTestExpectation` + `wait(for:timeout:)` for async flow completion and hook callbacks
- For SwiftUI plugin tests, use ViewInspector with `@testable import PlayerUISwiftUI`
- For JS-backed plugins, you can set `plugin.context = JSContext()` directly to test `setup` without a full player

---

## Conditional Compilation

Always guard bundle lookup with `#if SWIFT_PACKAGE`:

- **SPM builds**: use `Bundle.module` (auto-generated by SPM for targets with resources)
- **CocoaPods / framework builds**: use `Bundle(for: <PluginName>Plugin.self)` with a `.bundle` path component
