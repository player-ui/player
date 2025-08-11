### 🪢 Start Core ###

[doc('Build all core JS/TS files')]
build-core:
  bazel build //core/...

[doc('Test all core JS/TS files')]
test-core:
  bazel test //core/...

[doc('Build all core files required for native development')]
build-core-native:
  bazel build -- $(bazel query "attr(name, 'native_bundle', //...)" --output label 2>/dev/null | tr '\n' ' ')

### 🪢 End Core ###

### 🌐 Start JS ###

[doc('Build all JS/TS files')]
build-js:
  bazel build -- $(bazel query "kind(npm_package, //...)" --output label 2>/dev/null | tr '\n' ' ')

[doc('Test all JS/TS files')]
test-js:
  bazel test -- $(bazel query "kind(js_test, //...)" --output label 2>/dev/null | tr '\n' ' ')

[doc('Lint all JS/TS files')]
lint-js:
  bazel test -- $(bazel query "kind(js_test, //...) intersect attr(name, 'eslint$', //...)" --output label 2>/dev/null | tr '\n' ' ')

[doc('Run all the js benchmarks')]
benchmark-js:
  bazel query 'filter(".*_vitest_bench$", //...)' --output label 2>/dev/null | tr '\n' ' ' | xargs -n 1 bazel run

### 🌐 End JS ###

### 📚 Start Docs ###

[doc('Run a dev server of the main docs page')]
start-docs:
  bazel run //docs/site:dev

[doc('Run a dev server of storybook')]
start-storybook:
  bazel run //docs/storybook:start

### 📚 End Docs ###

### 📦 Start Maven ###

[doc('Install all generated artifacts into the system .m2 repository')]
mvn-install:
  #!/usr/bin/env bash
  set -u -e -o pipefail

  # Find all the maven packages in the repo
  readonly DEPLOY_LABELS=$(bazel query --output=label 'kind("maven_publish rule", //...) - attr("tags", "\[.*do-not-publish.*\]", //...)')
  for pkg in $DEPLOY_LABELS ; do
    bazel run "$pkg" --define=maven_repo="file://$HOME/.m2/repository"
  done

alias maven-install := mvn-install

### 📦 End Maven ###

### 🤖Start Android ###

[doc('Build and run the Android demo app in an emulator')]
start-android-demo:
  bazel run //android/demo:install

### 🤖 End Android ###

### 🍎 Start iOS ###

[doc('Generate and open the xcodeproj for Player. This requires Xcode to be your default for opening .xcodeproj files.

Run "build-core-native" first because Xcode willl not handle that automatically like bazel commands will.')]
dev-ios: build-core-native
  bazel run //ios:xcodeproj
  open ios/PlayerUI.xcodeproj/

[doc('Build and run the iOS demo app in a simulator')]
start-ios-demo:
  bazel run //ios/demo:PlayerUIDemo

[doc("List all test iOS targets. You should run them individually with `bazel test` locally or they won't pass.

If you run them all at once locally, too many simulators will open and they'll all time out and fail.
")]
list-test-ios:
  echo '🍎 Unit tests:'
  bazel query "kind(ios_unit_test, //...)"
  echo ''
  echo '🍎 UI tests:'
  bazel query "kind(ios_ui_test, //...)"

clean: # Force delete all the local cached bazel stuff. Be careful!
  # Delete all the bazel build artifacts
  rm -rf .build
  rm -rf .bazel-*

  # Delete cached node_modules and re-resolve packages
  rm -rf node_modules/
  rm -rf pnpm-lock.yaml
  pnpm install

  # Delete iOS stuff
  rm -rf ios/demo/.build
  rm -rf ios/demo/.swiftpm
  rm -rf ios/PlayerUI.xcodeproj
  rm -rf .swiftpm/

  # Then expunge for good measure
  bazel clean --expunge

### 🍎 End iOS ###