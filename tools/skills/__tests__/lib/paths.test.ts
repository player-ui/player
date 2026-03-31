import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

// Mock `os` so homedir() returns a controlled path
vi.mock("os", async (importOriginal) => {
  const actual = await importOriginal<typeof import("os")>();
  return {
    ...actual,
    default: {
      ...actual,
      homedir: vi.fn(() => "/mock/home"),
    },
  };
});

import os from "os";
import {
  getLocalSkillsDir,
  getGlobalSkillsDir,
  getSkillInstallPath,
  getSkillStatus,
  getInstalledSkillIds,
} from "../../src/lib/paths.js";

describe("getLocalSkillsDir", () => {
  test("returns .claude/skills relative to cwd", () => {
    const result = getLocalSkillsDir();
    expect(result).toBe(join(process.cwd(), ".claude", "skills"));
  });
});

describe("getGlobalSkillsDir", () => {
  test("returns ~/.claude/skills using os.homedir()", () => {
    const result = getGlobalSkillsDir();
    // homedir is mocked to /mock/home
    expect(result).toBe(join("/mock/home", ".claude", "skills"));
  });
});

describe("getSkillInstallPath", () => {
  test("returns <cwd>/.claude/skills/<id> for local scope", () => {
    const path = getSkillInstallPath("create-core-plugin", "local");
    expect(path).toBe(
      join(process.cwd(), ".claude", "skills", "create-core-plugin"),
    );
  });

  test("returns ~/.claude/skills/<id> for global scope", () => {
    const path = getSkillInstallPath("player-hooks-guide", "global");
    expect(path).toBe(
      join("/mock/home", ".claude", "skills", "player-hooks-guide"),
    );
  });
});

describe("getSkillStatus and getInstalledSkillIds", () => {
  let tempLocal: string;
  let tempGlobal: string;
  let cwdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    tempLocal = mkdtempSync(join(tmpdir(), "player-ui-local-"));
    tempGlobal = mkdtempSync(join(tmpdir(), "player-ui-global-"));
    mkdirSync(join(tempLocal, ".claude", "skills"), { recursive: true });
    cwdSpy = vi.spyOn(process, "cwd").mockReturnValue(tempLocal);
  });

  afterEach(() => {
    cwdSpy.mockRestore();
    rmSync(tempLocal, { recursive: true, force: true });
    rmSync(tempGlobal, { recursive: true, force: true });
  });

  function installLocal(skillId: string): void {
    const dir = join(tempLocal, ".claude", "skills", skillId);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      join(dir, "SKILL.md"),
      "---\nname: Test\ndescription: d\n---",
    );
  }

  describe("getSkillStatus", () => {
    test("returns 'available' when skill is not installed anywhere", () => {
      const status = getSkillStatus("some-skill");
      expect(status).toBe("available");
    });

    test("returns 'installed-local' when skill exists locally", () => {
      installLocal("create-core-plugin");
      const status = getSkillStatus("create-core-plugin");
      expect(status).toBe("installed-local");
    });

    test("returns 'installed-global' when skill exists globally but not locally", () => {
      // Point homedir at a temp dir that has the skill installed
      const globalDir = mkdtempSync(join(tmpdir(), "player-ui-global-status-"));
      const skillDir = join(
        globalDir,
        ".claude",
        "skills",
        "player-hooks-guide",
      );
      mkdirSync(skillDir, { recursive: true });
      writeFileSync(
        join(skillDir, "SKILL.md"),
        "---\nname: Test\ndescription: d\n---",
      );
      vi.mocked(os.homedir).mockReturnValue(globalDir);
      try {
        const status = getSkillStatus("player-hooks-guide");
        expect(status).toBe("installed-global");
      } finally {
        vi.mocked(os.homedir).mockReturnValue("/mock/home");
        rmSync(globalDir, { recursive: true, force: true });
      }
    });
  });

  describe("getInstalledSkillIds", () => {
    test("returns empty array when no skills are installed", () => {
      const ids = getInstalledSkillIds("local");
      expect(ids).toEqual([]);
    });

    test("returns IDs of all installed skills for local scope", () => {
      installLocal("create-core-plugin");
      installLocal("player-hooks-guide");

      const ids = getInstalledSkillIds("local");
      expect(ids).toContain("create-core-plugin");
      expect(ids).toContain("player-hooks-guide");
      expect(ids).toHaveLength(2);
    });

    test("returns empty array when skills directory does not exist at all", () => {
      rmSync(join(tempLocal, ".claude"), { recursive: true, force: true });
      const ids = getInstalledSkillIds("local");
      expect(ids).toEqual([]);
    });

    test("ignores directories without SKILL.md", () => {
      // A directory exists but has no SKILL.md — must not be reported as installed
      const dir = join(tempLocal, ".claude", "skills", "no-skill-md");
      mkdirSync(dir, { recursive: true });

      const ids = getInstalledSkillIds("local");
      expect(ids).toEqual([]);
    });

    test("returns installed skill IDs for global scope", () => {
      const globalDir = mkdtempSync(join(tmpdir(), "player-ui-global-ids-"));
      const skillDir = join(
        globalDir,
        ".claude",
        "skills",
        "create-core-plugin",
      );
      mkdirSync(skillDir, { recursive: true });
      writeFileSync(
        join(skillDir, "SKILL.md"),
        "---\nname: Test\ndescription: d\n---",
      );
      vi.mocked(os.homedir).mockReturnValue(globalDir);
      try {
        const ids = getInstalledSkillIds("global");
        expect(ids).toEqual(["create-core-plugin"]);
      } finally {
        vi.mocked(os.homedir).mockReturnValue("/mock/home");
        rmSync(globalDir, { recursive: true, force: true });
      }
    });
  });
});
