# How to Contribute

If you find something interesting you want contribute to the repo, feel free to raise a PR, or open an issue for features you'd like to see added.

## Proposing a Change

For small bug-fixes, documentation updates, or other trivial changes, feel free to jump straight to submitting a pull request. 

If the changes are larger (API design, architecture, etc), [opening an issue](https://github.com/player-ui/player/issues/new/choose) can be helpful to reduce implementation churn as we hash out the design.

## Requirements
* [npm >= 8.19.2](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
* [yarn >= 1.22.19](https://yarnpkg.com/)

* [Swift >= 5.2](https://www.swift.org/download/)

_Do not upgrade macOS to Sonoma , the minimum xcode version for Sonoma is 15. Stay on Ventura to keep xcode 14.3_
* [Xcode 14.3](https://developer.apple.com/download/all/) 
* [Ruby >= 2.6 && <= 3.0](https://github.com/rbenv/rbenv)

* [Android NDK >= 19.2.5345600, <= 21](https://github.com/android/ndk/wiki/Unsupported-Downloads#r19c). Any version > 21 will not work, period. You'll need to add `ANDROID_NDK_HOME` to your environment manually.

## Building and Testing Locally
#### Presetup
For iOS builds, some pre-setup is required for `bazel` to generate BUILD files for dependent CocoaPods.

```bash
bundle install
```
CocoaPods does not directly integrate with `bazel`, when core targets are updated, the output bundles need to be copied to the location described in the `PlayerUI.podspec`, to do so run the script:
```bash
./tools/build_ios_bundles.sh
```
This will query `bazel` for dependent targets, copy their output and regenerate the `.xcworkspace`.
### Player
For speed and consistency, this repo leverages `bazel` as it's main build tool. Check out the [bazel](https://bazel.build/) docs for more info.

After forking the repo, run builds using:

```bash
bazel build //...
```

Tests can also be ran using:

```bash
bazel test //...
```

#### Skipping iOS builds
The `.bazelrc` contains a convenience to build everything but the iOS targets, as the toolchain for those is platform specific.

```bash
bazel build --config=skip-ios
```

### Docs Sites
These require the [Android NDK](https://developer.android.com/ndk).
The docs site can be ran using:

```bash
bazel build //docs/site:start
bazel run //docs/site:start
```
which will run an instance on `http://localhost:3000`.


## Submitting a Pull Request

Prior to submitting a pull request, ensure that your fork and branch are up to date with the lastest changes on `main`. 

Any new features should have corresponding tests that exercise all code paths, and public symbols should have docstrings at a minimum. For more complex features, adding new documentation pages to the site to help guide users to consume the feature would be preferred.

When you're ready, submit a new pull request to the `main` branch and the team will be notified of the new requested changes. We'll do our best to respond as soon as we can. 

---

Inspired by react's [How to Contribute](https://reactjs.org/docs/how-to-contribute.html)
