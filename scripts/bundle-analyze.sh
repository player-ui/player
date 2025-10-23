#!/usr/bin/env bash
readonly JS_PACKAGES=`bazel query --output=package 'kind("npm_package rule", //...) - attr("tags", "\[.*do-not-publish.*\]", //...)'`

for pkg in $JS_PACKAGES ; do
    echo "pnpx @codecov/bundle-analyzer ./bazel-bin/${pkg}/dist --bundle-name=${pkg} --upload-token=$CODECOV_TOKEN"
done