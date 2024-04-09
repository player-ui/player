# How to Contribute

If you find something interesting you want contribute to the repo, feel free to raise a PR, or open an issue for features you'd like to see added.

[For first time contributors](./newCONTRIBUTORS.md)

## Proposing a Change

For small bug-fixes, documentation updates, or other trivial changes, feel free to jump straight to submitting a pull request. 

If the changes are larger (API design, architecture, etc), [opening an issue](https://github.com/player-ui/player/issues/new/choose) can be helpful to reduce implementation churn as we hash out the design.

## Requirements
* [npm >= 8.19.2](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
* [yarn >= 1.22.19](https://yarnpkg.com/)

* [Swift >= 5.5](https://www.swift.org/download/)
* [Xcode 15.3](https://developer.apple.com/download/all/) 

* [Android NDK >= 19.2.5345600, <= 21](https://github.com/android/ndk/wiki/Unsupported-Downloads#r19c). Any version > 21 will not work, period. You'll need to add `ANDROID_NDK_HOME` to your environment manually.

## Building and Testing Locally (All platforms)
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

## For Android Only builds
If you are interested in only contributing for android, follow our [android guide](https://github.com/player-ui/player/blob/main/android/demo/README.md)

## For iOS Only builds
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
