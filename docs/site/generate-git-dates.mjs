/* eslint-disable no-undef */
/**
 * Pre-build script to generate a JSON file with Git last modified dates
 * for all markdown files in the docs site.
 */
import { execSync } from "child_process";
import { writeFileSync, readdirSync } from "fs";
import { join } from "path";

const gitCwd = process.env.BUILD_WORKSPACE_DIRECTORY || process.cwd();
const docsDir = join(gitCwd, "docs/site/src/content/docs");

// Recursively find all markdown files
function findMarkdownFiles(dir, baseDir = dir) {
  const files = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...findMarkdownFiles(fullPath, baseDir));
      } else if (entry.name.endsWith(".md") || entry.name.endsWith(".mdx")) {
        // Store relative path from baseDir
        const relativePath = fullPath.replace(baseDir + "/", "");
        files.push(relativePath);
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }

  return files;
}

const mdFiles = findMarkdownFiles(docsDir);

const gitDates = {};

for (const relPath of mdFiles) {
  const fullPath = join("docs/site/src/content/docs", relPath);
  try {
    const result = execSync(`git log -1 --pretty="format:%cI" "${fullPath}"`, {
      cwd: gitCwd,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    if (result) {
      gitDates[relPath] = result.trim();
    }
  } catch (error) {
    // Silently ignore errors for files not in git
  }
}

// Write to output path (from command line arg or default location)
const outputPath = process.argv[2] || join(gitCwd, "docs/site/git-dates.json");
writeFileSync(outputPath, JSON.stringify(gitDates, null, 2));

console.log(
  `Generated git-dates.json with ${Object.keys(gitDates).length} entries`,
);
