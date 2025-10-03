#!/usr/bin/env bash
# Deploy documentation for both PR previews and releases

set -u -o pipefail

readonly GHA_ACTION="${1:-}"
readonly CIRCLE_BRANCH="${CIRCLE_BRANCH:-}"

echo "Deploying docs"
echo "GHA_Action: '$GHA_ACTION'"
echo "Branch: '$CIRCLE_BRANCH'"
echo "Pull Request: '$CIRCLE_PULL_REQUEST'"

# For PR builds, deploy to pr directory
if [ -n "$CIRCLE_PULL_REQUEST" ]; then
  PR_NUMBER=$(echo "$CIRCLE_PULL_REQUEST" | sed -E 's|.*/pull/([0-9]+).*|\1|')
  echo "Deploying PR docs to pr/$PR_NUMBER"
  
  STABLE_DOCS_BASE_PATH="pr/$PR_NUMBER" \
  STABLE_ALGOLIA_SEARCH_API_KEY="$ALGOLIA_NEXT_SEARCH_API_KEY" \
  STABLE_ALGOLIA_SEARCH_APPID="D477I7TDXB" \
  STABLE_ALGOLIA_SEARCH_INDEX="crawler_Player (Next)" \
  bazel run --config=release //docs:gh_deploy -- --dest_dir "pr/$PR_NUMBER"
  
  PR_URL="https://player-ui.github.io/pr/$PR_NUMBER/"
  
  # Only post PR comment for docs-only previews, not for canary builds
  # (canary builds will have their own comment posted by auto shipit)
  if [ "$GHA_ACTION" = "docs" ]; then
    # Get changed docs pages using shared utility
    CHANGED_PAGES=$(node scripts/get-changed-docs.js)
    
    # Build the message
    MESSAGE="## Build Preview\n\nA preview of your PR docs was deployed by CircleCI [#$CIRCLE_BUILD_NUM](https://circleci.com/gh/player-ui/player/$CIRCLE_BUILD_NUM) on \`$(date -u +'%a, %d %b %Y %H:%M:%S GMT')\`\n\n### 📖 Docs ([View site]($PR_URL))"
    
    MESSAGE="$MESSAGE\n$CHANGED_PAGES"
    
    npx auto comment --message "$(printf "$MESSAGE")" --context "build-preview"
    echo "PR comment posted for docs preview"
  else
    echo "Skipping PR comment - canary build will post its own comment"
  fi
  
  echo "PR docs deployed to: $PR_URL"
  exit 0
fi

# For non-PR releases, deploy to next/latest/versioned
echo "Deploying release docs"

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
