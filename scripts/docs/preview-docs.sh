#!/usr/bin/env bash
# Deploy documentation for PR previews only
# Next and release docs are handled by the release-docs.js auto plugin via afterShipIt

set -e -u -o pipefail

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

# Use shared docs-config to build the deployment command
# Version is automatically determined by docs-config using npx auto version
DEPLOY_CMD=$(node --input-type=module -e "
  import { buildDocsDeployCommand } from './scripts/docs/docs-config.js';
  console.log(buildDocsDeployCommand('pr/$PR_NUMBER', 'preview'));
")

# Execute the deployment command
eval "$DEPLOY_CMD"

# Use shared docs-config to get the URL
PR_URL=$(node --input-type=module -e "
  import { getDocsUrl } from './scripts/docs/docs-config.js';
  console.log(getDocsUrl('pr/$PR_NUMBER'));
")

# Only post PR comment for docs-only previews, not for canary builds
# (canary builds will have their own comment posted by auto shipit)
if [ "$GHA_ACTION" = "docs" ]; then
  # Get changed docs pages using shared utility (passing PR number)
  CHANGED_PAGES=$(node scripts/docs/get-changed-docs.js origin/main "$PR_NUMBER")
  
  # Build the message
  MESSAGE="## Build Preview\n\nA preview of your PR docs was deployed by CircleCI [#$CIRCLE_BUILD_NUM](https://circleci.com/gh/player-ui/player/$CIRCLE_BUILD_NUM) on \`$(date -u +'%a, %d %b %Y %H:%M:%S GMT')\`\n\n### 📖 Docs ([View site]($PR_URL))"
  
  MESSAGE="$MESSAGE\n$CHANGED_PAGES"
  
  npx auto comment --pr "$PR_NUMBER" --context "build-preview" --edit --message "$(printf "$MESSAGE")"
  echo "PR comment posted for docs preview"
else
  echo "Skipping PR comment - canary build will post its own comment"
fi

echo "PR docs deployed to: $PR_URL"

