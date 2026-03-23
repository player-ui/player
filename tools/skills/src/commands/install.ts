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
import { installSkillFiles } from "../lib/installer.js";
import { getSkillInstallPath } from "../lib/paths.js";
import type { InstallScope } from "../lib/paths.js";

/**
 * Registers the `install` subcommand.
 *
 * Presents a multi-select list of available skills, prompts for scope
 * (local vs global), then copies selected SKILL.md files into the
 * appropriate `.claude/skills/<id>/` directory.
 */
export function registerInstallCommand(program: Command): void {
  program
    .command("install")
    .description(
      "Interactively select and install Player-UI Claude Code skills",
    )
    .action(async (): Promise<void> => {
      intro("Player-UI Skills — Install");

      const skills = getAllSkills();

      const selected = await multiselect<string>({
        message:
          "Select skills to install  (space to toggle, enter to confirm)",
        options: skills.map((skill) => ({
          value: skill.id,
          label: skill.name,
          hint: skill.description,
        })),
        required: false,
      });

      if (isCancel(selected)) {
        cancel("Installation cancelled.");
        return;
      }

      if (selected.length === 0) {
        outro("No skills selected.");
        return;
      }

      const scope = await select<InstallScope>({
        message: "Install scope",
        options: [
          {
            value: "local",
            label: "Local  — .claude/skills/ in current repo",
          },
          { value: "global", label: "Global — ~/.claude/skills/" },
        ],
      });

      if (isCancel(scope)) {
        cancel("Installation cancelled.");
        return;
      }

      const s = spinner();
      s.start("Installing skills…");
      await installSkillFiles(selected, skills, scope);
      s.stop(`Installed ${selected.length} skill(s).`);

      outro(
        scope === "local"
          ? `Skills installed to .claude/skills/ — available in this repo.`
          : `Skills installed to ~/.claude/skills/ — available globally.`,
      );
    });
}
