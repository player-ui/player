/* eslint-env node */
/* eslint-disable no-undef */
import { execSync } from "child_process";
import { getDocsUrl } from "./docs-config.js";

/**
 * Utility to get changed docs pages for PR comments
 *
 * @param {string} baseBranch - The base branch to compare against (default: "origin/main")
 * @returns {Array<{name: string, url: string}>} Array of changed docs pages with names and relative URLs
 *
 * Usage:
 *   import { getChangedDocsPages } from "./get-changed-docs.js";
 *   const pages = getChangedDocsPages();
 *
 * CLI Usage:
 *   node scripts/get-changed-docs.js [base-branch] [pr-number]
 */
export function getChangedDocsPages(baseBranch = "origin/main") {
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
      .filter((file) => file.startsWith("site/src/content/docs/")) // Only include docs pages
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

/**
 * Format changed pages as a markdown list with full URLs
 *
 * @param {string} destDir - The destination directory (e.g., "pr/123", "next")
 * @param {string} baseBranch - The base branch to compare against
 * @returns {string} Markdown list of changed pages with links, or empty string
 */
export function formatChangedPagesMarkdown(
  destDir,
  baseBranch = "origin/main",
) {
  const pages = getChangedDocsPages(baseBranch);

  if (pages.length === 0) {
    return "";
  }

  const baseUrl = getDocsUrl(destDir);
  return pages
    .map((page) => `- [${page.name}](${baseUrl}${page.url}/)`)
    .join("\n");
}

// If run directly, output the changed pages
// Usage: node scripts/get-changed-docs.js [base-branch] [pr-number]
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const baseBranch = process.argv[2] || "origin/main";
  const prNumber =
    process.argv[3] || process.env.CIRCLE_PULL_REQUEST?.split("/").pop();

  if (!prNumber) {
    console.error(
      "Error: PR number required. Provide as argument or set CIRCLE_PULL_REQUEST env var",
    );
    process.exit(1);
  }

  const markdown = formatChangedPagesMarkdown(`pr/${prNumber}`, baseBranch);
  console.log(markdown);
}
