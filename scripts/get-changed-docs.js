/* eslint-env node */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable no-undef */
const { execSync } = require("child_process");

/**
 * Utility to get changed docs pages for PR comments
 * Usage: node scripts/get-changed-docs.js [base-branch]
 */
function getChangedDocsPages(baseBranch = "origin/main") {
  try {
    // Get changed files that are in the docs directory
    const diffCommand = `git diff --name-only ${baseBranch}...HEAD | grep -E '^docs/' | sed 's|^docs/||'`;

    const changedFiles = execSync(diffCommand, { encoding: "utf8" }).trim();

    if (!changedFiles) {
      return [];
    }

    // Parse the files and create readable page names with URLs
    const pages = changedFiles
      .split("\n")
      .filter((file) => file.trim())
      .slice(0, 10) // Limit to 10 pages
      .map((file) => {
        // Convert file path to a more readable format
        const pageName = file
          .replace("src/content/docs/", "")
          .replace("site/", "")
          .replace(".mdx", "")
          .replace(".md", "");

        // Create URL path (keep slashes for nested pages)
        const pageUrl = file
          .replace("src/content/docs/", "")
          .replace("site/", "")
          .replace(".mdx", "")
          .replace(".md", "");

        return {
          name: pageName,
          url: pageUrl,
        };
      });

    return pages;
  } catch (error) {
    console.error("Error getting changed docs pages:", error.message);
    return [];
  }
}

function formatChangedPages(pages, prUrl) {
  if (!pages || pages.length === 0) {
    return "\nNo docs changes found";
  }

  const pageList = pages
    .map((page) => `- [${page.name}](${prUrl}${page.url}/)`)
    .join("\n");

  return `\n**Updated pages:**\n${pageList}`;
}

// If run directly, output the changed pages
if (require.main === module) {
  const baseBranch = process.argv[2] || "origin/main";
  const pages = getChangedDocsPages(baseBranch);

  if (pages.length > 0) {
    const pageList = pages
      .map(
        (page) =>
          `- [${page.name}](https://player-ui.github.io/pr/720/${page.url}/)`,
      )
      .join("\n");
    console.log(pageList);
  } else {
    console.log("No docs changes found");
  }
}

module.exports = { getChangedDocsPages, formatChangedPages };
