build-all:
  bazel build //...

build-js:
    bazel build -- $(bazel query "kind(npm_package, //...)" --output label 2>/dev/null | tr '\n' ' ')
  
test-all:
  bazel test //...

test-js:
  bazel test -- $(bazel query "kind(js_test, //...)" --output label 2>/dev/null | tr '\n' ' ')

lint-js:
  bazel test -- $(bazel query "kind(js_test, //...) intersect attr(name, 'eslint$', //...)" --output label 2>/dev/null | tr '\n' ' ')

start-docs:
  bazel run //docs/site:start

start-storybook:
  bazel run //docs/storybook:start