#!/usr/bin/env bash
readonly JS_PACKAGES=`bazel query --output=package 'kind("npm_package rule", //...) - attr("tags", "\[.*do-not-publish.*\]", //...)'`
readonly JS_BUILD_TARGETS=`bazel query --output=label 'kind("js_library rule", //...) intersect attr(name, "_library$", //...) - attr("tags", "\[.*do-not-publish.*\]", //...)'`

bazel build -- $JS_BUILD_TARGETS

for pkg in $JS_PACKAGES ; do
    npx @codecov/bundle-analyzer ./bazel-bin/${pkg}/dist --bundle-name=${pkg} --ignore-patterns="*.map" --upload-token=$CODECOV_TOKEN
done