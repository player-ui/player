#!/usr/bin/env bash
# See https://github.com/bazelbuild/rules_nodejs/blob/stable/scripts/publish_release.sh 

set -u -o pipefail



# Called by auto -- `release` for normal releases or `snapshot` for canary/next.
readonly RELEASE_TYPE=${1:-snapshot}
readonly CURRENT_BRANCH=`git symbolic-ref --short HEAD`

NPM_TAG=canary
if [ "$RELEASE_TYPE" == "next" ] && [ "$CURRENT_BRANCH" == "main" ]; then
  NPM_TAG=next
elif [ "$RELEASE_TYPE" == "release" ] && [ "$CURRENT_BRANCH" == "main" ]; then
  # Releases off the main branch are for older majors. 
  # Don't want to bump the latest tag for those
  NPM_TAG=latest
fi

# NPM Prepublish
echo "Publishing NPM Packages using tag: ${NPM_TAG} from release type: ${RELEASE_TYPE} on branch: ${CURRENT_BRANCH}"
readonly PKG_NPM_LABELS=`bazel query --output=label 'kind("npm_package rule", //...) - attr("tags", "\[.*do-not-publish.*\]", //...)'`

bazel build --config=release $PKG_NPM_LABELS

# iOS Prepublish
bazel build --config=release //:PlayerUI_Podspec //:PlayerUI_Pod

# Maven Central Prepublish
MVN_RELEASE_TYPE=snapshot
if [ "$RELEASE_TYPE" == "next" ] && [ "$CURRENT_BRANCH" == "main" ]; then
  MVN_RELEASE_TYPE=release
elif [ "$RELEASE_TYPE" == "release" ] && [ "$CURRENT_BRANCH" == "main" ]; then
  MVN_RELEASE_TYPE=release
fi

bazel build --config=release @rules_player//distribution:staged-maven-deploy

# NPM Publish
echo "Publishing NPM Packages with release type: ${NPM_TAG} on branch: ${CURRENT_BRANCH}"
for pkg in $PKG_NPM_LABELS ; do
  bazel run --config=release -- ${pkg}.npm-publish --access public --tag ${NPM_TAG}
done

# iOS Publish
echo "Publishing iOS Packages"
bazel run --config=release //:ios_publish

# Android/JVM Publish
echo "Publishing Maven Packages with release type: ${MVN_RELEASE_TYPE} on branch: ${CURRENT_BRANCH}"
bazel run --config=release @rules_player//distribution:staged-maven-deploy -- "$MVN_RELEASE_TYPE" --package-group=com.intuit.playerui --client-timeout=600 --connect-timeout=600


