# How to Contribute

If you find something interesting you want contribute to the repo, feel free to raise a PR, or open an issue for features you'd like to see added.

## Proposing a Change

For small bug-fixes, documentation updates, or other trivial changes, feel free to jump straight to submitting a pull request. 

If the changes are larger (API design, architecture, etc), [opening an issue](https://github.com/player-ui/player/issues/new/choose) can be helpful to reduce implementation churn as we hash out the design.

## Requirements
* [npm >= 8.19.2](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
* [yarn >= 1.22.19](https://yarnpkg.com/)
* [Swift >= 5.2](https://www.swift.org/download/)
* [Xcode >= 14.0](https://developer.apple.com/xcode/)
* [Android NDK >= 19.2.5345600, <= 21](https://github.com/android/ndk/wiki/Unsupported-Downloads#r19c). Any version > 21 will not work, period. You'll need to add `ANDROID_NDK_HOME` to your environment manually.

## Building and Testing Locally
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

### Docs Sites
These require the [Android NDK](https://developer.android.com/ndk).
The docs site can be ran using:

```bash
bazel build //docs/site:start
bazel run //docs/site:start
```
which will run an instance on `http://localhost:3000`.


## Submitting a Pull Request

Please ensure that any new features have sufficient tests, code coverage, and documentation. 

When you're ready, submit a new pull request to the `main` branch and the team will be notified of the new requested changes. We'll do our best to respond as soon as we can. 

---

Inspired by react's [How to Contribute](https://reactjs.org/docs/how-to-contribute.html)