import { existsSync, readdirSync } from "fs";
import { join } from "path";
import os from "os";

export type InstallScope = "local" | "global";
export type SkillStatus = "installed-local" | "installed-global" | "available";

/** Returns the local skills directory (.claude/skills/ in cwd). */
export function getLocalSkillsDir(): string {
  return join(process.cwd(), ".claude", "skills");
}

/** Returns the global skills directory (~/.claude/skills/). */
export function getGlobalSkillsDir(): string {
  return join(os.homedir(), ".claude", "skills");
}

/** Returns the install directory for a specific skill and scope. */
export function getSkillInstallPath(
  skillId: string,
  scope: InstallScope,
): string {
  const base = scope === "local" ? getLocalSkillsDir() : getGlobalSkillsDir();
  return join(base, skillId);
}

/**
 * Checks whether a skill is installed locally, globally, or not at all.
 * Local takes precedence when installed in both places.
 */
export function getSkillStatus(skillId: string): SkillStatus {
  if (existsSync(join(getLocalSkillsDir(), skillId, "SKILL.md"))) {
    return "installed-local";
  }
  if (existsSync(join(getGlobalSkillsDir(), skillId, "SKILL.md"))) {
    return "installed-global";
  }
  return "available";
}

/**
 * Returns the IDs of all skills that are currently installed for the given scope.
 * Only includes skills that have a SKILL.md file inside their directory.
 */
export function getInstalledSkillIds(scope: InstallScope): string[] {
  const dir = scope === "local" ? getLocalSkillsDir() : getGlobalSkillsDir();
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() && existsSync(join(dir, entry.name, "SKILL.md")),
    )
    .map((entry) => entry.name);
}
