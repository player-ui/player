#!/usr/bin/env bash

set -u -e -o pipefail

# Find all the maven packages in the repo
readonly DEPLOY_LABELS=$(bazel query --output=label 'kind("maven_publish rule", //...) - attr("tags", "\[.*do-not-publish.*\]", //...)')
for pkg in $DEPLOY_LABELS ; do
  bazel run "$pkg" --define=maven_repo="file://$HOME/.m2/repository"
done
