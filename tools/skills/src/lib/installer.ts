import { copyFile, mkdir, rm } from "fs/promises";
import { join } from "path";
import type { InstallScope } from "./paths.js";
import type { SkillMeta } from "./skills.js";
import { getSkillInstallPath } from "./paths.js";

/**
 * Copies SKILL.md for each skill ID into the appropriate install directory.
 * Skills not found in the provided list are silently skipped.
 */
export async function installSkillFiles(
  skillIds: string[],
  skills: SkillMeta[],
  scope: InstallScope,
): Promise<void> {
  for (const skillId of skillIds) {
    const skill = skills.find((s) => s.id === skillId);
    if (!skill) continue;
    const destDir = getSkillInstallPath(skillId, scope);
    await mkdir(destDir, { recursive: true });
    await copyFile(skill.mdPath, join(destDir, "SKILL.md"));
  }
}

/**
 * Removes the install directory for each skill ID.
 */
export async function removeSkillFiles(
  skillIds: string[],
  scope: InstallScope,
): Promise<void> {
  for (const skillId of skillIds) {
    const destDir = getSkillInstallPath(skillId, scope);
    await rm(destDir, { recursive: true, force: true });
  }
}
