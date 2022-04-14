#!/bin/bash
git_root=$(git rev-parse --show-toplevel)

"bazel" build `bazel query 'attr(name, "^.*_Bundles$", //...)' --output label 2>/dev/null`
cd "$git_root/xcode" && bundle exec pod install