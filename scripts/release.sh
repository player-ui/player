#!/usr/bin/env bash
# See https://github.com/bazelbuild/rules_nodejs/blob/stable/scripts/publish_release.sh 

set -u -o pipefail



# Called by auto -- `release` for normal releases or `snapshot` for canary/next.
readonly RELEASE_TYPE=${1:-snapshot}
readonly CURRENT_BRANCH=`git symbolic-ref --short HEAD`

# NPM_TAG=canary
# if [ "$RELEASE_TYPE" == "next" ] && [ "$CURRENT_BRANCH" == "main" ]; then
#   NPM_TAG=next
# elif [ "$RELEASE_TYPE" == "release" ] && [ "$CURRENT_BRANCH" == "main" ]; then
#   # Releases off the main branch are for older majors. 
#   # Don't want to bump the latest tag for those
#   NPM_TAG=latest
# fi

# # NPM Publishing
# echo "Publishing NPM Packages using tag: ${NPM_TAG} from release type: ${RELEASE_TYPE} on branch: ${CURRENT_BRANCH}"
# readonly PKG_NPM_LABELS=`bazel query --output=label 'kind("npm_package rule", //...) - attr("tags", "\[.*do-not-publish.*\]", //...)'`

# for pkg in $PKG_NPM_LABELS ; do
#   bazel run --config=release -- ${pkg}.npm-publish --access public --tag ${NPM_TAG}
# done

# # Rebuild to stamp the release podspec
# bazel build --config=release //:PlayerUI_Podspec //:PlayerUI_Pod
# bazel run --config=release //:ios_publish

# Maven Central publishing
MVN_RELEASE_TYPE=snapshot
if [ "$RELEASE_TYPE" == "next" ] && [ "$CURRENT_BRANCH" == "main" ]; then
  MVN_RELEASE_TYPE=release
elif [ "$RELEASE_TYPE" == "release" ] && [ "$CURRENT_BRANCH" == "main" ]; then
  MVN_RELEASE_TYPE=release
fi

echo "Publishing Maven Packages with release type: ${MVN_RELEASE_TYPE} on branch: ${CURRENT_BRANCH}"
bazel run --config=release @rules_player//distribution:staged-maven-deploy -- "$MVN_RELEASE_TYPE" --package-group=com.intuit.playerui --client-timeout=600 --connect-timeout=600

# Running this here because it will still have the pre-release version in the VERSION file before auto cleans it up
# Make sure to re-stamp the outputs with the BASE_PATH so nextjs knows what to do with links

# Docs publishing
# echo "Publishing Docs with release type: ${RELEASE_TYPE} on branch: ${CURRENT_BRANCH}"
# if [ "$RELEASE_TYPE" == "next" ] && [ "$CURRENT_BRANCH" == "main" ]; then 
#  STABLE_DOCS_BASE_PATH="next" \
#  STABLE_ALGOLIA_SEARCH_API_KEY=$ALGOLIA_NEXT_SEARCH_API_KEY \
#  STABLE_ALGOLIA_SEARCH_APPID="D477I7TDXB" \
#  STABLE_ALGOLIA_SEARCH_INDEX="crawler_Player (Next)" \
#  bazel run --verbose_failures --config=release //docs:gh_deploy -- --dest_dir next
# elif [ "$RELEASE_TYPE" == "release" ] && [ "$CURRENT_BRANCH" == "main" ]; then
#  STABLE_DOCS_BASE_PATH="latest" \
#  STABLE_ALGOLIA_SEARCH_API_KEY=$ALGOLIA_SEARCH_API_KEY \
#  STABLE_ALGOLIA_SEARCH_APPID="OX3UZKXCOH" \
#  STABLE_ALGOLIA_SEARCH_INDEX="player-ui" \
#  bazel run --verbose_failures --config=release //docs:gh_deploy -- --dest_dir latest
# fi

# # Also deploy to the versioned folder for main releases
# if [ "$RELEASE_TYPE" == "release" ]; then
#   SEMVER_MAJOR=$(cat VERSION | cut -d. -f1)
#   STABLE_DOCS_BASE_PATH=$SEMVER_MAJOR \ 
#   STABLE_ALGOLIA_SEARCH_API_KEY=$ALGOLIA_SEARCH_API_KEY \
#   STABLE_ALGOLIA_SEARCH_APPID="OX3UZKXCOH" \
#   STABLE_ALGOLIA_SEARCH_INDEX="player-ui" \
#   bazel run --verbose_failures --config=release //docs:gh_deploy -- --dest_dir "$SEMVER_MAJOR"
# fi
