#!/usr/bin/env bash
# Deploy documentation based on release type and branch

set -u -o pipefail

readonly GHA_ACTION="${1:-}"
readonly CIRCLE_BRANCH="${CIRCLE_BRANCH:-}"

echo "Building and deploying docs for release"
echo "GHA_Action: '$GHA_ACTION'"
echo "Branch: '$CIRCLE_BRANCH'"

# Build the docs first
bazel build --config=release //docs:gh_deploy

# If GHA_Action = "release" + main branch -> full release (deploy to latest/)
# If GHA_Action = "" + main branch -> next release (deploy to next/)
if [ "$GHA_ACTION" = "release" ] && [ "$CIRCLE_BRANCH" = "main" ]; then
  echo "Full release detected - deploying to latest/"
  STABLE_DOCS_BASE_PATH="latest" \
  STABLE_ALGOLIA_SEARCH_API_KEY=$ALGOLIA_SEARCH_API_KEY \
  STABLE_ALGOLIA_SEARCH_APPID="OX3UZKXCOH" \
  STABLE_ALGOLIA_SEARCH_INDEX="player-ui" \
  bazel run --config=release //docs:gh_deploy -- --dest_dir "latest"
  
  echo "Docs deployed to: https://player-ui.github.io/latest/"
elif [ "$GHA_ACTION" = "" ] && [ "$CIRCLE_BRANCH" = "main" ]; then
  echo "Next release detected - deploying to next/"
  STABLE_DOCS_BASE_PATH="next" \
  STABLE_ALGOLIA_SEARCH_API_KEY="$ALGOLIA_NEXT_SEARCH_API_KEY" \
  STABLE_ALGOLIA_SEARCH_APPID="D477I7TDXB" \
  STABLE_ALGOLIA_SEARCH_INDEX="crawler_Player (Next)" \
  bazel run --config=release //docs:gh_deploy -- --dest_dir "next"
  
  echo "Docs deployed to: https://player-ui.github.io/next/"
else
  echo "No docs deployment needed for this context"
fi

# Also deploy to the versioned folder for releases
if [ "$GHA_ACTION" = "release" ]; then
  SEMVER_MAJOR=$(cat VERSION | cut -d. -f1)
  echo "Deploying versioned docs to: $SEMVER_MAJOR"
  STABLE_DOCS_BASE_PATH="$SEMVER_MAJOR" \
  STABLE_ALGOLIA_SEARCH_API_KEY=$ALGOLIA_SEARCH_API_KEY \
  STABLE_ALGOLIA_SEARCH_APPID="OX3UZKXCOH" \
  STABLE_ALGOLIA_SEARCH_INDEX="player-ui" \
  bazel run --config=release //docs:gh_deploy -- --dest_dir "$SEMVER_MAJOR"
  
  echo "Versioned docs deployed to: https://player-ui.github.io/$SEMVER_MAJOR/"
fi
