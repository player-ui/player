import {
  cancel,
  intro,
  isCancel,
  multiselect,
  outro,
  select,
  spinner,
} from "@clack/prompts";
import type { Command } from "commander";

import { getAllSkills } from "../lib/skills.js";
import { installSkillFiles, removeSkillFiles } from "../lib/installer.js";
import { getInstalledSkillIds } from "../lib/paths.js";
import type { InstallScope } from "../lib/paths.js";

/**
 * Registers the `list` subcommand.
 *
 * Shows all skills with pre-checked state reflecting what is already
 * installed for the chosen scope.  The user can toggle skills with the
 * spacebar and press Enter to apply the diff (install new, remove unchecked).
 */
export function registerListCommand(program: Command): void {
  program
    .command("list")
    .description(
      "View and manage installed Player-UI Claude Code skills interactively",
    )
    .action(async (): Promise<void> => {
      intro("Player-UI Skills — Manage");

      const skills = getAllSkills();
      const availableIds = skills.map((s) => s.id);

      const scope = await select<InstallScope>({
        message: "Which scope would you like to manage?",
        options: [
          {
            value: "local",
            label: "Local  — .claude/skills/ in current repo",
          },
          { value: "global", label: "Global — ~/.claude/skills/" },
        ],
      });

      if (isCancel(scope)) {
        cancel("Cancelled.");
        return;
      }

      const installedIds = getInstalledSkillIds(scope);

      const selected = await multiselect<string>({
        message:
          "Checked = installed. Toggle with space, enter to apply changes.",
        options: skills.map((skill) => ({
          value: skill.id,
          label: skill.name,
          hint: skill.description,
        })),
        initialValues: installedIds,
        required: false,
      });

      if (isCancel(selected)) {
        cancel("No changes made.");
        return;
      }

      const toInstall = selected.filter((id) => !installedIds.includes(id));
      // Only remove skills that are in the available list to avoid accidentally
      // deleting skills installed by a different version of this tool.
      const toRemove = installedIds.filter(
        (id) => availableIds.includes(id) && !selected.includes(id),
      );

      if (toInstall.length === 0 && toRemove.length === 0) {
        outro("No changes.");
        return;
      }

      const s = spinner();
      s.start("Applying changes…");
      await installSkillFiles(toInstall, skills, scope);
      await removeSkillFiles(toRemove, scope);
      s.stop("Done.");

      const parts: string[] = [];
      if (toInstall.length > 0) parts.push(`installed ${toInstall.length}`);
      if (toRemove.length > 0) parts.push(`removed ${toRemove.length}`);
      outro(parts.join(", ") + ".");
    });
}
