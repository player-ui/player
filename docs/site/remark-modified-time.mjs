import { execSync } from "child_process";

export function remarkModifiedTime() {
  return function (tree, file) {
    const filepath = file.history[0];
    try {
      const result = execSync(`git log -1 --pretty="format:%cI" "${filepath}"`);
      file.data.astro.frontmatter.lastUpdated = new Date(
        result.toString().trim(),
      );
    } catch (error) {
      console.warn(`Could not get git info for ${filepath}:`, error.message);
    }
  };
}

