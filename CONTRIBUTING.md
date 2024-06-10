# How to Contribute

If you find something interesting you want contribute to the repo, feel free to raise a PR, or open an issue for features you'd like to see added.

[For first time contributors](./newCONTRIBUTORS.md)

## Proposing a Change

For small bug-fixes, documentation updates, or other trivial changes, feel free to jump straight to submitting a pull request. 

If the changes are larger (API design, architecture, etc), [opening an issue](https://github.com/player-ui/player/issues/new/choose) can be helpful to reduce implementation churn as we hash out the design.

## Requirements
* [bazelisk](https://github.com/bazelbuild/bazelisk)
* [npm >= 8.19.2](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
* [yarn >= 1.22.19](https://yarnpkg.com/)

* [Swift >= 5.2](https://www.swift.org/download/)
* [Xcode 14.3](https://developer.apple.com/download/all/) 
* [Ruby >= 2.6 && <= 3.0](https://github.com/rbenv/rbenv)

* [Android NDK >= 19.2.5345600, <= 21](https://github.com/android/ndk/wiki/Unsupported-Downloads#r19c). Any version > 21 will not work, period. You'll need to add `ANDROID_NDK_HOME` to your environment manually.

* [Signed Commits](https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification). For convenience it is recommended to set git to sign all commits by default as mentioned [here](https://docs.github.com/en/authentication/managing-commit-signature-verification/telling-git-about-your-signing-key)

## Building and Testing Locally (All platforms)
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

`bazel` does not process resources the same way CocoaPods does, so in order to share the same [mocks](https://github.com/player-ui/player/tree/main/plugins/reference-assets/mocks) as the other platforms, there is a [precompile script](https://github.com/player-ui/player/blob/main/PlayerUI.podspec#L84-L91) that generates a `.swift` file with the mocks. In order for this to work, `node` must be accessible in your environment. To verify this, run:
```sh
env node
```

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

## For Android Only builds
If you are interested in only contributing for android, follow our [android guide](https://github.com/player-ui/player/blob/main/android/demo/README.md)

## For iOS Only builds
If you are interested in only contributing for iOS, follow our [iOS guide](https://github.com/player-ui/player)



## Docs Sites
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
