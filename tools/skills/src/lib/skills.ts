import { readdirSync, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join } from "path";

export interface SkillMeta {
  id: string;
  name: string;
  description: string;
  mdPath: string;
}

/**
 * Parses the YAML frontmatter block from a SKILL.md file.
 * Extracts the `name` and `description` fields.
 */
export function parseSkillFrontmatter(content: string): {
  name: string;
  description: string;
} {
  const match = /^---\n([\s\S]*?)\n---/.exec(content);
  if (!match) {
    throw new Error("No YAML frontmatter found in SKILL.md");
  }
  const frontmatter = match[1];
  const nameMatch = /^name:\s*(.+)$/m.exec(frontmatter);
  const descMatch = /^description:\s*(.+)$/m.exec(frontmatter);
  return {
    name: nameMatch?.[1]?.trim() ?? "Unknown",
    description: descMatch?.[1]?.trim() ?? "",
  };
}

/**
 * Returns the absolute path to the bundled skills directory.
 * Resolves relative to the current module so it works both in source
 * (src/lib/skills.ts → ../../skills) and in the bundle (dist/index.mjs → ../skills).
 */
export function getSkillsDir(): string {
  // From dist/index.mjs the URL is file://.../dist/index.mjs
  // ../skills resolves to .../skills — correct for both local dev and npm install
  return fileURLToPath(new URL("../../skills", import.meta.url));
}

/**
 * Reads all available skills from the bundled skills directory.
 */
export function getAllSkills(skillsDir?: string): SkillMeta[] {
  const dir = skillsDir ?? getSkillsDir();
  const entries = readdirSync(dir, { withFileTypes: true });

  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const id = entry.name;
      const mdPath = join(dir, id, "SKILL.md");
      const content = readFileSync(mdPath, "utf-8");
      const { name, description } = parseSkillFrontmatter(content);
      return { id, name, description, mdPath };
    });
}
