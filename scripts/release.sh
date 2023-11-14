#!/usr/bin/env bash
# See https://github.com/bazelbuild/rules_nodejs/blob/stable/scripts/publish_release.sh 

set -u -o pipefail

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

# Rebuild to stamp the release podspec
bazel build --config=release //:PlayerUI_Podspec //:PlayerUI_Pod

# VScode extension publishing
bazel run --config=release //language/vscode-player-syntax:vscode-plugin.publish

# Maven Central publishing
bazel run @rules_player//distribution:staged-maven-deploy -- "$RELEASE_TYPE" --package-group=com.intuit.player --legacy --client-timeout=600 --connect-timeout=600

# Running this here because it will still have the pre-release version in the VERSION file before auto cleans it up
# Make sure to re-stamp the outputs with the BASE_PATH so nextjs knows what to do with links
if [ "$RELEASE_TYPE" == "snapshot" ] && [ "$CURRENT_BRANCH" == "main" ]; then
  STABLE_DOCS_BASE_PATH=next bazel run --verbose_failures --config=release //docs:deploy_docs -- --dest_dir next
elif [ "$RELEASE_TYPE" == "release" ] && [ "$CURRENT_BRANCH" == "main" ]; then
  STABLE_DOCS_BASE_PATH=latest bazel run --verbose_failures --config=release //docs:deploy_docs -- --dest_dir latest
fi

# Also deploy to the versioned folder for main releases
if [ "$RELEASE_TYPE" == "release" ]; then
  SEMVER_MAJOR=$(cat VERSION | cut -d. -f1)
  STABLE_DOCS_BASE_PATH=$SEMVER_MAJOR bazel run --verbose_failures --config=release //docs:deploy_docs -- --dest_dir "$SEMVER_MAJOR"
fi
