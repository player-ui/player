#!/usr/bin/env bash
# See https://github.com/bazelbuild/rules_nodejs/blob/stable/scripts/publish_release.sh 

set -u -e -o pipefail

readonly PKG_NPM_LABELS=`bazel query --output=label 'kind("pkg_npm rule", //...) - attr("tags", "\[.*do-not-publish.*\]", //...)'`
NPM_TAG=canary

# Called by auto -- `release` for normal releases or `snapshot` for canary/next.
readonly RELEASE_TYPE=${1:-snapshot}
readonly CURRENT_BRANCH=`git symbolic-ref --short HEAD`

if [ "$RELEASE_TYPE" == "snapshot" ] && [ "$CURRENT_BRANCH" == "main" ]; then
  NPM_TAG=next
elif [ "$RELEASE_TYPE" == "release" ] && [ "$CURRENT_BRANCH" == "main" ]; then
  # Releases off the main branch are for older majors. 
  # Don't want to bump the latest tag for those

  NPM_TAG=latest
fi

for pkg in $PKG_NPM_LABELS ; do
  bazel run --config=release -- ${pkg}.publish --access public --tag ${NPM_TAG}
done


# Fetch artifacts from the iOS stage of this build
# CIRCLE_BUILD_NUMBER is for the iOS Stage of the build
# and populated by a .ios-build-number file that is written in that stage
mkdir -p /tmp/$CIRCLE_BUILD_NUMBER
$(dirname -- "$0")/fetchArtifacts.sh > /tmp/$CIRCLE_BUILD_NUMBER/artifacts.json

# Find the pod zip url
export CIRCLE_CI_ZIP=$($(dirname -- "$0")/parseArtifactJson.js /tmp/$CIRCLE_BUILD_NUMBER/artifacts.json)


# Rebuild to stamp the release podspec
bazel build --config=release //:PlayerUI_Podspec

# Push the podspec to cocoapods, verifying against the zip in the iOS stage artifacts
# so there is a URL to verify
bazel run --config=release //:PlayerUI_Pod_Push

# Running this here because it will still have the pre-release version in the VERSION file before auto cleans it up
bazel run --config=release //docs:deploy_docs

bazel run @rules_player//distribution:staged-maven-deploy -- "$RELEASE_TYPE" --package-group=com.intuit.player --legacy
