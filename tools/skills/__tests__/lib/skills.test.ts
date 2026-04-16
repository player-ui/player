import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { parseSkillFrontmatter, getAllSkills } from "../../src/lib/skills.js";

const VALID_SKILL_MD = `---
name: Create Core Plugin
description: Scaffold a TypeScript core PlayerPlugin with hooks and tests
version: "1.0"
---

# Create Core Plugin

Content here.
`;

const MULTI_LINE_DESC_SKILL_MD = `---
name: Player Hooks Guide
description: Reference guide for all Player hook surfaces
---

# Player Hooks Guide
`;

describe("parseSkillFrontmatter", () => {
  test("parses name and description from valid frontmatter", () => {
    const result = parseSkillFrontmatter(VALID_SKILL_MD);
    expect(result.name).toBe("Create Core Plugin");
    expect(result.description).toBe(
      "Scaffold a TypeScript core PlayerPlugin with hooks and tests",
    );
  });

  test("parses minimal frontmatter with only name and description", () => {
    const result = parseSkillFrontmatter(MULTI_LINE_DESC_SKILL_MD);
    expect(result.name).toBe("Player Hooks Guide");
    expect(result.description).toBe(
      "Reference guide for all Player hook surfaces",
    );
  });

  test("returns Unknown when name field is missing", () => {
    const content = "---\ndescription: Some description\n---\n# Title";
    const result = parseSkillFrontmatter(content);
    expect(result.name).toBe("Unknown");
  });

  test("returns empty string when description field is missing", () => {
    const content = "---\nname: My Skill\n---\n# Title";
    const result = parseSkillFrontmatter(content);
    expect(result.description).toBe("");
  });

  test("throws when no frontmatter block is present", () => {
    expect(() => parseSkillFrontmatter("# Just a heading")).toThrow(
      "No YAML frontmatter found",
    );
  });

  test("throws on empty string", () => {
    expect(() => parseSkillFrontmatter("")).toThrow(
      "No YAML frontmatter found",
    );
  });

  test("trims whitespace from name and description values", () => {
    const content =
      "---\nname:   Trimmed Name   \ndescription:   Trimmed Desc   \n---";
    const result = parseSkillFrontmatter(content);
    expect(result.name).toBe("Trimmed Name");
    expect(result.description).toBe("Trimmed Desc");
  });
});

describe("getAllSkills", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "player-ui-skills-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  function createSkill(id: string, name: string, description: string): void {
    const skillDir = join(tempDir, id);
    mkdirSync(skillDir);
    writeFileSync(
      join(skillDir, "SKILL.md"),
      `---\nname: ${name}\ndescription: ${description}\n---\n# ${name}\n`,
    );
  }

  test("returns all skills from the directory", () => {
    createSkill(
      "create-core-plugin",
      "Create Core Plugin",
      "Scaffold a plugin",
    );
    createSkill("player-hooks-guide", "Player Hooks Guide", "Hook reference");

    const skills = getAllSkills(tempDir);
    expect(skills).toHaveLength(2);
    const ids = skills.map((s) => s.id);
    expect(ids).toContain("create-core-plugin");
    expect(ids).toContain("player-hooks-guide");
  });

  test("populates name and description fields", () => {
    createSkill(
      "create-core-plugin",
      "Create Core Plugin",
      "Scaffold a plugin",
    );

    const skills = getAllSkills(tempDir);
    expect(skills[0]?.name).toBe("Create Core Plugin");
    expect(skills[0]?.description).toBe("Scaffold a plugin");
  });

  test("populates mdPath pointing to SKILL.md", () => {
    createSkill(
      "create-core-plugin",
      "Create Core Plugin",
      "Scaffold a plugin",
    );

    const skills = getAllSkills(tempDir);
    expect(skills[0]?.mdPath).toBe(
      join(tempDir, "create-core-plugin", "SKILL.md"),
    );
  });

  test("returns empty array when skills directory is empty", () => {
    const skills = getAllSkills(tempDir);
    expect(skills).toHaveLength(0);
  });

  test("ignores non-directory entries", () => {
    writeFileSync(join(tempDir, "README.md"), "# Skills");
    createSkill(
      "create-core-plugin",
      "Create Core Plugin",
      "Scaffold a plugin",
    );

    const skills = getAllSkills(tempDir);
    expect(skills).toHaveLength(1);
    expect(skills[0]?.id).toBe("create-core-plugin");
  });

  test("returns correct id matching directory name", () => {
    createSkill("my-custom-skill", "My Custom Skill", "Does stuff");

    const skills = getAllSkills(tempDir);
    expect(skills[0]?.id).toBe("my-custom-skill");
  });
});

describe("getAllSkills — default skills directory", () => {
  test("reads from the bundled skills directory when no override is provided", () => {
    // getAllSkills() with no argument uses getSkillsDir() which resolves
    // to the real skills/ directory relative to this module.
    const skills = getAllSkills();
    expect(skills.length).toBeGreaterThan(0);
    for (const skill of skills) {
      expect(typeof skill.id).toBe("string");
      expect(skill.id.length).toBeGreaterThan(0);
      expect(typeof skill.name).toBe("string");
      expect(skill.name).not.toBe("Unknown");
      expect(skill.mdPath).toMatch(/SKILL\.md$/);
    }
  });
});
