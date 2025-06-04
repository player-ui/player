[doc('Build all JS/TS files')]
build-js:
    bazel build -- $(bazel query "kind(npm_package, //...)" --output label 2>/dev/null | tr '\n' ' ')

[doc('Build all core JS/TS files')]
build-core:
    bazel build //core/...

[doc('Test targets in the project')]
test-all:
  bazel test //...

[doc('Test all JS/TS files')]
test-js:
  bazel test -- $(bazel query "kind(js_test, //...)" --output label 2>/dev/null | tr '\n' ' ')

[doc('Test all core JS/TS files')]
test-core:
    bazel test //core/...

[doc('Lint all JS/TS files')]
lint-js:
  bazel test -- $(bazel query "kind(js_test, //...) intersect attr(name, 'eslint$', //...)" --output label 2>/dev/null | tr '\n' ' ')

[doc('Run a dev server of the main docs page')]
start-docs:
  bazel run //docs/site:dev

[doc('Run a dev server of storybook')]
start-storybook:
  bazel run //docs/storybook:start

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

[doc('Build and run the Android demo app in an emulator')]
start-android-demo:
  bazel mobile-install //android/demo:demo

[doc('Generate and open the xcodeproj for Player')]
dev-ios:
  bazel run //ios:xcodeproj
  open -a Xcode ios/PlayerUI.xcodeproj/

[doc('Build and run the iOS demo app in a simulator')]
start-ios-demo:
  bazel run //ios/demo:PlayerUIDemo
