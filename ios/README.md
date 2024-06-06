# PlayerUI iOS Development Guide
## Setup
### Xcode Project generation
Generate the `.xcodeproj` to open and work in Xcode. Builds and tests will be executed through bazel, to ensure behavioral parity.

```bash
bazel run //ios:xcodeproj
open -a Xcode ios/PlayerUI.xcodeproj/
```
### Demo Application
#### Xcode
The first time the Xcode project is generated, the default selected target is `PlayerUI`, for a runnable target select `PlayerUIDemo` to run the demo application in the simulator.

#### Bazel
The demo app can also be built and launched in a simulator from the command line with bazel:
```bash
bazel run //ios/demo:PlayerUIDemo
```

## Adding a new plugin
Adding a new plugin is simple using predefined macros for `BUILD.bazel` files. Additional steps are required to include new code in the final artifacts, and in the Xcode project.

### iOS vs SwiftUI Plugins
iOS plugins provide generic functionality to any Player implementation on iOS. Generally these plugins are used to load core JavaScript plugin functionality into Swift, and to provide swift APIs for those plugins.

SwiftUI plugins are more targetted at the specific `SwiftUIPlayer` implementation, and typically are needed to link up Player functionality into the SwiftUI environment.

### Scaffold
All iOS plugins follow a common structure, with SwiftUI plugins defining a different test folder.

The basic structure is as follows:
```bash
plugins/example
├── ios
│   ├── BUILD.bazel
│   ├── Sources
│   │   └── ExamplePlugin.swift
│   └── Tests
│       └── ExamplePluginTests.swift
└── swiftui
    ├── BUILD.bazel
    ├── Sources
    │   └── ExamplePlugin.swift
    └── ViewInspector
        └── ExamplePluginViewInspectorTests.swift
```

To scaffold your plugin, create a new `ios` or `swiftui` folder in the appropriate plugin directory, with the appropriate folders, and a blank `BUILD.bazel`

```bash
mkdir -p plugins/example/ios/Sources
mkdir -p plugins/example/ios/Tests
touch plugins/example/ios/BUILD.bazel
```

or for SwiftUI plugins:
```bash
mkdir -p plugins/example/swiftui/Sources
mkdir -p plugins/example/swiftui/ViewInspector
touch plugins/example/swiftui/BUILD.bazel
```

### BUILD
#### iOS Plugin
For plugins that are not specifically for SwiftUI, the `ios_plugin` macro will handle the full build:
```python
load("//tools/ios:util.bzl", "ios_plugin")

ios_plugin(name = "ExamplePlugin")
```

#### SwiftUI Plugin
For plugins that are SwiftUI specific, the `swiftui_plugin` macro will handle the full build:
```python
load("//tools/ios:util.bzl", "swiftui_plugin")

swiftui_plugin(
    name = "ExamplePlugin",
    resources = [],
    deps = [
        "//ios/swiftui:PlayerUISwiftUI"
    ]
)
```

#### Dependencies
Both `ios_plugin` and `swiftui_plugin` take `deps` and `test_deps`, to allow specifying dependencies on other swift targets.

```python
swiftui_plugin(
    name = "ExamplePlugin",
    resources = [],
    deps = [
        "//ios/swiftui:PlayerUISwiftUI"
    ],
    test_deps = [
        "//plugins/reference-assets/swiftui:PlayerUIReferenceAssets",
    ]
)
```

For external dependencies, see [External Dependencies](#external-dependencies).

#### JavaScript Resources
As PlayerUI is a cross platform project, that aims for code reuse, many plugins for iOS are built on top of core plugin functionality. These JS resources can be easily included in either the `ios_plugin` or `swiftui_plugin` macros:

```python
ios_plugin(
    name = "ExamplePlugin",
    resources = ["//plugins/example/core:core_native_bundle"]
)

swiftui_plugin(
    name = "ExamplePlugin",
    resources = ["//plugins/example/core:core_native_bundle"]
    deps = [
        "//ios/swiftui:PlayerUISwiftUI"
    ]
)
```

This will create a resource bundle with the provided name, as well as any necessary runtime files for accessing `Bundle.module` from bazel. These resource bundles and extensions are only ever created at runtime by bazel, they can be viewed in Xcode, but the project needs to be built first to generate the files.

#### Examining Targets
Macros can produce multiple bazel targets, the targets exposed from any give `BUILD.bazel` file can be listed:
```bash
$ bazel query //plugins/example/ios/...
```

The `name` passed into `ios_plugin` or `swiftui_plugin` is prefixed with `PlayerUI` by default:

```python
ios_plugin(name = "ExamplePlugin")
```

For iOS plugins the `js_pipeline` for the core plugin should have `native_bundle` set to `ExamplePlugin` to match the `name` in the ios_plugin

```python
js_pipeline(
    native_bundle = "ExamplePlugin"
    ...
)
```


Will produce a `swift_library` target called `PlayerUIExamplePlugin`.

### Xcode
To add new plugins to be visible + testable in Xcode, the test target needs to be added to `ios/BUILD.bazel` as a top level target:

```python

xcodeproj(
    name = "xcodeproj",
    project_name = "PlayerUI",
    tags = ["manual"],
    top_level_targets = [
        ...,
        "//plugins/example/ios:PlayerUIExamplePluginTests",
        # or for swiftui
        "//plugins/example/swiftui:PlayerUIExamplePluginViewInspectorTests",
    ],
)

```

After adding the new target to `xcodeproj`, rerun `bazel run //ios:xcodeproj` to regenerate the `PlayerUI.xcodeproj`.

### Package Manifests
When adding a new plugin, the steps to add it to bazel and Xcode allow us to do local development and testing, but do not expose the plugin in the SPM module, or the CocoaPod. We will need to update `Package.swift` and `PlayerUI.podspec` to expose the new plugins to those package managers.

#### Package.swift

In `Package.swift` there are two arrays of plugin entries, one for `ios_plugin` equivalents, and one for `swiftui_plugin` equivalents. Add the new plugin to the appropriate array, the `name` and all dependencies listed will be prefixed with `PlayerUI` to simplify this file.

```swift
let ios_plugins: [SwiftPlugin] = [
    ...,
    (name: "ExamplePlugin", path: "example", resources: true)
]
```

##### Adding utility packages

For packages that do not fit the plugin pattern, targets must be manually specified, and products can use the `.playerPackage` extension to expose the product from the Package.

```swift
products: [
    ...,
    .playerPackage("PlayerUIUtilityPackage")
```

#### PlayerUI.podspec

In `PlayerUI.podspec` subspecs are listed in a single location, and there are `ios_plugin` and `swiftui_plugin` functions to generate the subspec entries.

```ruby
# Plugin Name, Path, Resources
ios_plugin.call("ExamplePlugin", "example", FALSE)
# Plugin Name, Path, Dependencies, Resources
swiftui_plugin.call("ExamplePlugin", "example", ["OtherPlugin"] FALSE)
```

##### Adding Utility Packages
For packages that do not fit the plugin pattern, subspecs must be manually specified to set the appropriate file paths for Sources and Resources.

### Artifacts

To add new plugins to final code artifacts, the sources and resources must be added to the root `BUILD.bazel`. For both CocoaPods and SPM, files are expected to match the locations in the respective `PlayerUI.podspec` or `Package.swift`, and as such we need to map resources to the intended locations in the final archive.

```python
assemble_pod(
    name = "PlayerUI_Pod",
    srcs = glob([
        "LICENSE",
        "Package.swift",
    ]),
    data = {
        ...,
        "//plugins/example/ios:PlayerUIExamplePlugin_Sources": "plugins/example/ios/",
        "//plugins/example/core:core_native_bundle": "plugins/example/ios/Resources/"
    },
    podspec = ":PlayerUI.podspec",
)
```

## Advanced Usage

### External Dependencies

Adding external dependencies for packages is simple, but requires some manual changes to bazel files.

> [!NOTE]
> As `PlayerUI` is published as a Swift Package and a CocoaPod, external dependencies must be available on both package managers.

#### Bazel
Bazel resolution of external swift dependencies is done with [rules_swift_package_manager](https://github.com/cgrindel/rules_swift_package_manager). 

Add new dependencies for plugins to both the main `Package.swift` for final consumer user, and to `xcode/Package.swift` for workspace use.

> [!TIP]
> With `Package.swift` manifest files, dependencies for consuming users are resolved regardless of whether or not the consuming user relies the product with that dependency. Due to this, test packages, and developer tooling can conflict with consuming users. To avoid this potential conflict, project level dependencies are redeclared in `xcode/Package.swift`. This allows the main `Package.swift` to contain dependencies only for the library targets, and no testing or tooling dependencies.

After adding the dependency, a bazel command is used to regenerate the dependency index:
```bash
bazel run //:swift_update_pkgs
```

After updating the index, `MODULE.bazel` needs to be updated to expose that package in the `use_repo` call:
```python
use_repo(
    swift_deps,
    "swiftpkg_swift_hooks",
    ...,
    "swiftpkg_<package_name>"
)
```

Package names are converted to snake case, if you are unsure what name to use, open `swift_deps.bzl` and search for the git repository for that dependency to find its entry and name.

Once the `MODULE.bazel` entry is updated, the dependency is available to bazel targets:
```
@swiftpkg_<package_name>//:Sources_<PackageName>
```

#### SPM / CocoaPods

Adding external dependencies to package manifests follows the normal convention for those package managers. If you are deviating from the plugin pattern to add an external dependency, you will need to specify the targets manually.

### Bazel Macros
Both `ios_plugin` and `swiftui_plugin` call the same `ios_pipeline` macro, and hardcode some of the parameters to that pipeline. For more complex usecases, `ios_pipeline` can be used directly, to generate tests for packages that have both regular unit tests, as well as SwiftUI ViewInspector based tests.

Example:

```python
load("@rules_player//ios:defs.bzl", "ios_pipeline")

ios_pipeline(
    name = "PlayerUITestUtilitiesCore",
    resources = ["//core/make-flow:make-flow_native_bundle"],
    deps = [
        "//ios/core:PlayerUI",
        "//ios/swiftui:PlayerUISwiftUI",
        "//ios/logger:PlayerUILogger"
    ],
    test_deps = [
        "//plugins/reference-assets/swiftui:PlayerUIReferenceAssets",
        "//ios/internal-test-utils:PlayerUIInternalTestUtilities"
    ],
    hasUnitTests = True,
    hasViewInspectorTests = True
)
```
