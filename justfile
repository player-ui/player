[doc('Build all targets in the project')]
build-all:
  bazel build //...

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
  bazel run //docs/site:start

[doc('Run a dev server of storybook')]
start-storybook:
  bazel run //docs/storybook:start