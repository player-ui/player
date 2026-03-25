# @player-ui/skills

Claude Code skills installer for Player UI development.

## Overview

This package bundles a set of curated [Claude Code skills](https://docs.anthropic.com/en/docs/claude-code/skills) that guide AI assistants through common Player UI development tasks like creating plugins across platforms, understanding the hook system, and more. A small CLI (`player-ui-skills`) copies the skill files into Claude's skills directories so they are automatically available during coding sessions.

Each skill is a self-contained `SKILL.md` file with YAML front matter (name, description) and a detailed markdown body covering architecture, code templates, API references, and testing patterns.

## Available Skills

| Skill ID                      | Name                                  | Description                                                                                                                                                        |
| ----------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `create-core-plugin`          | Create Core Player Plugin             | Create a TypeScript plugin for the core Player runtime — PlayerPlugin interface, hooks, expressions, schema/validation, data middleware, and testing               |
| `create-react-plugin`         | Create React Player Plugin            | Create a React plugin — ReactPlayerPlugin interface, asset registration, ReactPlayer hooks, context providers, ReactAsset, and testing with @testing-library/react |
| `create-android-plugin`       | Create Android Player Plugin (Kotlin) | Create an Android/Kotlin plugin — AndroidPlayerPlugin, JVM-level hooks, JS-backed plugins via JSScriptPluginWrapper, asset registration, and lifecycle             |
| `create-jvm-plugin`           | Create JVM Player Plugin (Kotlin)     | Create a JVM/Kotlin plugin — PlayerPlugin, JSScriptPluginWrapper, RuntimePlugin, LoggerPlugin, coroutine integration, and HeadlessPlayer testing                   |
| `create-swift-plugin`         | Create Swift/iOS Player Plugin        | Create a Swift/iOS plugin — NativePlugin, JSBasePlugin, SwiftUI hooks, ManagedPlayerPlugin, WithSymbol/findPlugin, and HeadlessPlayerImpl testing                  |
| `create-multiplatform-plugin` | Create Multiplatform Player Plugin    | Create a plugin that spans TypeScript, React, Android, iOS, and SwiftUI — architecture, shared concepts, platform wrappers, and native IIFE bundles                |
| `player-hooks-guide`          | Player Hooks Guide                    | Reference for the Player UI hook system — all hook surfaces, tapable-ts patterns, controller hooks, and when to use each hook                                      |

## Installation

### From npm

```bash
npx @player-ui/skills install
```

### From source (monorepo development)

```bash
bazel build //tools/skills:@player-ui/skills
```

## Usage

The CLI provides two commands: `install` for adding skills and `list` for managing installed skills.

### install

Interactively select skills and install them.

```bash
npx @player-ui/skills install
```

1. A multi-select list of all available skills is presented
2. Toggle skills with **space**, confirm with **enter**
3. Choose a scope:
   - **Local** — installs to `.claude/skills/` in the current repository
   - **Global** — installs to `~/.claude/skills/` in your home directory

### list

View and manage currently installed skills. Lets you add new skills or remove existing ones in a single step.

```bash
npx @player-ui/skills list
```

1. Choose a scope (local or global)
2. A multi-select list shows all skills; already-installed skills are pre-checked
3. Toggle skills to add or remove them, then confirm with **enter**

Only skills bundled by this package are managed — skills installed by other tools are never modified.

## How Skills Work

Skills are markdown files that Claude Code loads automatically to gain domain-specific knowledge. When a user's prompt matches a skill's description, Claude uses the skill's content to produce better, more accurate code.

### File layout

```
.claude/skills/
  create-core-plugin/
    SKILL.md
  create-react-plugin/
    SKILL.md
  ...
```

### Scope precedence

If a skill is installed in both local and global directories, the **local** copy takes precedence.

### SKILL.md format

Each skill file starts with YAML front matter followed by the skill body:

```markdown
---
name: Create Core Player Plugin
description: Use when the user wants to create a Player UI plugin in TypeScript...
version: "2.0"
argument-hint: "[plugin-name e.g. analytics-tracker]"
---

# Create Core Player Plugin

(detailed instructions, templates, API references, testing patterns...)
```

The installer reads `name` and `description` from the front matter. The `version` and `argument-hint` fields are informational.

## Adding a New Skill

1. Create a new directory under `catalog/`:

   ```
   catalog/my-new-skill/
     SKILL.md
   ```

2. Add YAML front matter with at least `name` and `description`:

   ```markdown
   ---
   name: My New Skill
   description: Use when the user wants to...
   ---
   ```

3. Write the skill body with the guidance, templates, and references the AI assistant should use.

4. The skill will be automatically discovered by the CLI and included in the `install` and `list` commands.
