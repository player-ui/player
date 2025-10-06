#!/usr/bin/env bash
# Deploy documentation for PR previews only
# Next and release docs are handled by the release-docs.js auto plugin via afterShipIt

set -u -o pipefail

readonly GHA_ACTION="${1:-}"

echo "Deploying PR preview docs"
echo "GHA_Action: '$GHA_ACTION'"
echo "Pull Request: '$CIRCLE_PULL_REQUEST'"

# Only handle PR builds
if [ -z "$CIRCLE_PULL_REQUEST" ]; then
  echo "Not a PR build - skipping preview docs"
  echo "(Next/release docs are handled by the release-docs.js auto plugin)"
  exit 0
fi

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

