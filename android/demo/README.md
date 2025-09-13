# Local Android Development

### Setup

The following tools should only be required if you're building Android related targets -- and can be installed through the [sdkmanager CLI](https://developer.android.com/tools/sdkmanager) or the [Android Studio SDK Manager](https://developer.android.com/studio/intro/update#sdk-manager).

> [!TIP]
> If you're encountering _unexpected_ errors due to missing SDK/NDK, ensure you're not including Android targets implicitly, such as through [target pattern](https://bazel.build/run/build#specifying-build-targets) `//...` expansion or as a dependency of the explicit target to be built

<table>
  <thead>
    <tr>
      <th>Tool</th>
      <th>Version</th>
      <th>Recommendations</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>
        <a href="https://developer.android.com/tools/releases/platforms">
          Android SDK
        </a>
      </td>
      <td>&gt;= 35</td>
      <td>
        Unless the SDK path is manually configured via the `android_sdk_repository` rule, the `ANDROID_HOME` environment variable should be defined when you're invoking build targets that require the SDK. SDK support is provided by [rules_android](https://github.com/bazelbuild/rules_android), see their README for more information.
      </td>
    </tr>
    <tr>
      <td>
        <a href="https://github.com/android/ndk/releases">Android NDK</a>
      </td>
      <td>&gt;= 25b</td>
      <td>
        Unless the NDK path is manually configured via the `android_ndk_repository`, the `ANDROID_NDK_HOME` environment variable should be defined when you're invoking build targets that require the NDK. NDK support is provided by [rules_android_ndk](https://github.com/bazelbuild/rules_android_ndk), see their README for more information, including NDK version compatibility.
      </td>
    </tr>
  </tbody>
</table>

### Building & `just` Cheat-sheet

Several [`just`](https://github.com/casey/just) commands have been provided to make invoking Android related build steps easier -- take a look at the [`justfile`](/justfile) to better understand what they're doing.

#### Querying

For all the below context, it might be helpful to understand what targets actual exist for a given Bazel package. The following command will list all the targets (and what rule they actually are) under `//path/to/package`:

```bash
bazel query 'kind(".*", //path/to/package/...)' --output=label_kind
```

#### Building

Building actually doesn't have a `just` command, since building is typically in the context of something you're trying to do. Typically, it's advised to perform that action instead (i.e. linting, testing, publishing, installing) to ensure all the context is available for building.

A great example of a target that isn't buildable on it's own is `//jvm/hermes/src/main/jni:hermes_jni_lib` -- it relies on _where_ it's being consumed from to provide the JNI context to build with. While you might not attempt to build that target explicitly, it can still implicitly fail your Bazel command, i.e. `bazel test //jvm/hermes/...`.

> [!IMPORTANT]
> If you must aggregate targets through `//...` expansion, it's best to query or filter on targets that actually match what you're looking for. The `justfile` uses this pattern for running all tests of a certain type.

#### Testing

To run _all_ Kotlin unit tests:
```bash
just test-kt
```

To run _all_ _local_ Android instrumented tests (no emulator required):
```bash
just test-android-local
```

To run _all_ _remote_ Android instrumented tests (emulator required):
```bash
just test-android-ui
```

To run _all_ Android tests (emulator required):
```bash
just test-android
```

#### Linting

Kotlin linting is powered by [ktlint](https://github.com/pinterest/ktlint), and is configured through the [`.editorconfig`](/.editorconfig).

To lint _all_ Kotlin sources:
```bash
just lint-kt
```

To fix _all_ Kotlin lint issues:
```bash
just format-kt
```

#### Publishing

To publish _all_ Maven packages locally:
```bash
just mvn-install
```

#### Installing Demo App

The Android demo application is built to showcase the broad functionality of Player, as well as some of the foundational plugins contained in this repo.

To run:
1. Ensure you have a device connected to adb, can verify with:
   ```bash
   adb devices
   ```

2. Configure `mobile-install` with installed `adb`, if not `/usr/bin/adb`, for example:
   ```
   # .bazelrc.local
   mobile-install --adb=/Users/{user}/Library/Android/sdk/platform-tools/adb
   ```

3. Install the demo app with:
   ```bash
   just start-android-demo
   ```

> [!NOTE]
> This is enough to pick up _any_ new changes since the app last installed. Additionally, the APK file can be found at `bazel-bin/android/demo/demo.apk`, which can be distributed and installed manually through ADB or dragging to your emulator

### Troubleshooting

#### SDK Troubleshooting

If your SDK isn't setup correctly, you should see an error like this:

```
every rule of type android_toolchain implicitly depends upon the target '@@rules_androi++android_sdk_repository_extension+androidsdk//:fail'
```

Verify `ANDROID_HOME` is properly set to the SDK root (ex: `/Users/{user}/Library/Android/sdk`) -- it should contain `platforms/android-xx` if an SDK is actually installed.

#### NDK Troubleshooting

If your NDK isn't setup correctly, you might see an error like this:

```
Either the ANDROID_NDK_HOME environment variable or the path attribute of android_ndk_repository must be set.
```

Verify `ANDROID_NDK_HOME` is properly set to the NDK root (ex: `/Users/{user}/Library/Android/sdk/ndk/26.1.10909125/`).

#### Android Demo app failed to install

If `just start-android-demo` (`bazel mobile-install //android/demo`) fails, there may be a few causes.

1. No devices connected to `adb`

Error:
```
Error: No device connected to ddmlib
```

Solution:
Ensure an emulator, or real device, is running and connected to `adb`. Should be listed when `adb devices` is invoked.

2. `mobile-install` `adb` is not configured properly

Error:
```
E/adb: Cannot run program "/usr/bin/adb": error=2, No such file or directory
Got error installing using the Android Studio deployer: exit status 1
```

Solution:
Follow step 2 of [Installing Demo App](#installing-demo-app) from above.

3. Failed to install

Occasionally, the `mobile-install` command will yield an invalid APK -- this is usually remedied by changing a file to force a rebuild, but if persistent, the app can be installed manually through `adb`.

```bash
just start-android-demo-manual
```
