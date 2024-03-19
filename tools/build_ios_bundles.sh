#!/bin/bash
git_root=$(git rev-parse --show-toplevel)

# Build all bundle targets that we rely on
"bazel" build `bazel query 'attr(name, "^.*_Bundles$", //...)' --output label 2>/dev/null`
# explicitly build make-flow
"bazel" build //core/make-flow/...
# run yarn so make-flow is importable in node runtime
yarn
# Run pod install to generate xcworkspace
cd "$git_root/xcode" && bundle exec pod install