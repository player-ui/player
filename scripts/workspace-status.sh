#!/usr/bin/env bash

set -eo pipefail # exit immediately if any command fails.

echo STABLE_GIT_COMMIT $(git rev-parse HEAD)
echo STABLE_VERSION $(cat VERSION)

commit_sha=$(git rev-parse HEAD)
echo "COMMIT_SHA $commit_sha"

git_branch=$(git rev-parse --abbrev-ref HEAD)
echo "GIT_BRANCH $git_branch"

git_tree_status=$(git diff-index --quiet HEAD -- && echo 'Clean' || echo 'Modified')
echo "GIT_TREE_STATUS $git_tree_status"