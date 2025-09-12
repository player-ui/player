#!/usr/bin/env bash

set -u -o pipefail

# Deploy canary documentation for a specific PR and comment on the PR
# Usage: ./scripts/deploy-canary-docs.sh <pr_number>

readonly PR_NUMBER=${1:-}

if [ -z "$PR_NUMBER" ]; then
  echo "Error: PR number is required"
  echo "Usage: $0 <pr_number>"
  exit 1
fi

echo "Deploying canary docs for PR #$PR_NUMBER"

# Deploy docs with canary base path
bazel run //docs:gh_deploy \
  --define=STABLE_DOCS_BASE_PATH=canary-$PR_NUMBER \
  -- --dest_dir canary-$PR_NUMBER

echo "Canary docs deployed to: https://player-ui.github.io/canary-$PR_NUMBER/"

# Comment on the PR
npx auto comment --pr $PR_NUMBER --message "📚 **Documentation Preview Available**

Your canary documentation changes are now available at:
https://player-ui.github.io/canary-$PR_NUMBER/

This preview will update with each canary release."
