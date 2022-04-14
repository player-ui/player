#!/usr/bin/env bash

set -u -e -o pipefail

readonly DEPLOY_LABELS=`bazel query --output=label "kind('deploy_.* rule', ${2:-//...})"`

# skip pkg releases for now

# for pkg in $DEPLOY_LABELS ; do
#   bazel run $pkg -- $1
# done

# Running this here because it will still have the pre-release version in the VERSION file before auto cleans it up
bazel run //docs:deploy_docs