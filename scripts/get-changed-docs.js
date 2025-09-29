#!/usr/bin/env node

/**
 * Utility to get changed docs pages for PR comments
 * Usage: node scripts/get-changed-docs.js [base-branch]
 */

import { execSync } from "child_process";

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
    return "";
  }

  const pageList = pages
    .map((page) => `- [${page.name}](${prUrl}${page.url}/)`)
    .join("\n");

  return `\n\n**Changed pages:**\n${pageList}`;
}

// If run directly, output the changed pages
if (import.meta.url === `file://${process.argv[1]}`) {
  const baseBranch = process.argv[2] || "origin/main";
  const pages = getChangedDocsPages(baseBranch);

  if (pages.length > 0) {
    console.log("Changed docs pages:");
    pages.forEach((page) => {
      console.log(
        `- [${page.name}](https://player-ui.github.io/pr/720/${page.url}/)`,
      );
    });
  } else {
    console.log("No docs pages changed");
  }
}

export { getChangedDocsPages, formatChangedPages };
