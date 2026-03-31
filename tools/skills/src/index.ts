#!/usr/bin/env node
import { Command } from "commander";
import { registerInstallCommand } from "./commands/install.js";
import { registerListCommand } from "./commands/list.js";

const program = new Command();

program
  .name("player-ui-skills")
  .description("Claude Code skills manager for Player-UI development");

registerInstallCommand(program);
registerListCommand(program);

program.parse();
