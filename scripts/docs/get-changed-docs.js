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
    const getChangedFilesRaw = () => {
      const diffCommand = `git diff --name-only ${baseBranch}...HEAD`;
      return execSync(diffCommand, {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).trim();
    };

    let changedFilesRaw = "";
    try {
      changedFilesRaw = getChangedFilesRaw();
    } catch {
      // Best-effort: if the base ref isn't available locally (common in CI), fetch and retry.
      try {
        execSync("git fetch --no-tags --quiet origin main", {
          stdio: ["ignore", "ignore", "ignore"],
        });
      } catch {
        // ignore
      }
      changedFilesRaw = getChangedFilesRaw();
    }
    const changedFiles = changedFilesRaw
      ? changedFilesRaw
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const hookSourceChanged = changedFiles.some((file) => {
      // Hooks docs are generated during the Bazel docs build and not tracked in git anymore.
      // To keep PR preview comments useful, flag the Hooks page when hook-related paths change.
      // We consider hooks docs potentially impacted if:
      // - core player TS sources change
      // - plugin core TS sources change
      // - any path segment named "hooks" changes
      return (
        file.startsWith("core/player/src/") ||
        /^plugins\/[^/]+\/core\/src\//.test(file) ||
        /(^|\/)[Hh]ooks(\/|$)/.test(file) ||
        // If the generator or its Bazel wiring changes, the Hooks page output likely changes too.
        file === "docs/site/BUILD" ||
        file === "scripts/docs/generate-hooks-docs.mjs" ||
        file.startsWith("scripts/docs/")
      );
    });

    // Parse docs files and create readable page names with URLs
    const docPages = changedFiles
      .filter((file) => file.startsWith("docs/"))
      .map((file) => file.replace(/^docs\//, ""))
      .filter((file) => file.startsWith("site/src/content/docs/")) // Only include docs pages
      .slice(0, 10) // Limit to 10 pages
      .map((file) => {
        // Convert file path to a more readable format
        const pageName = file
          .replace("src/content/docs/", "")
          .replace("site/", "")
          .replace(".mdx", "")
          .replace(".md", "");

        // Create URL path (keep slashes for nested pages, strip index files)
        const pageUrl = file
          .replace("src/content/docs/", "")
          .replace("site/", "")
          .replace(".mdx", "")
          .replace(".md", "")
          .replace(/\/?index$/, "") // Remove "/index" or "index" suffix for landing pages
          .toLowerCase(); // Docs Preview URLs are case sensitive and need to be lower case

        return {
          name: pageName,
          url: pageUrl,
        };
      });

    const pages = [];

    if (hookSourceChanged) {
      pages.push({ name: "plugins/hooks", url: "plugins/hooks" });
    }

    // Keep output concise, but always prefer including Hooks if it was detected.
    for (const p of docPages) {
      if (pages.length >= 10) break;
      pages.push(p);
    }

    return pages;
  } catch (error) {
    // Best-effort: if git diff can't run (e.g., missing base ref), don't fail PR comments.
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
    .map((page) => {
      return `- [${page.name}](${baseUrl}${page.url})`;
    })
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
