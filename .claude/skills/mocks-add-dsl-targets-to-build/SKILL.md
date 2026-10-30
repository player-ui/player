---
name: mocks-add-dsl-targets-to-build
description: Add the DSL compilation targets (npm_link_all_packages, dsl_config, compile_mocks) to a plugin's mocks/BUILD file, renaming any existing `mocks` filegroup. Use when asked to set up DSL/TSX mock compilation for a plugin directory, e.g. /mocks-add-dsl-targets-to-build plugins/beacon.
---

# Add DSL compilation targets to mocks folder

Invoked on the **parent** directory of a `mocks/` folder (e.g. `plugins/beacon`). Edits `<parent>/mocks/BUILD`.

Args: `<parent-dir> [mock-dir-name | all] [--skip-git-prompt]`

- `<parent-dir>`: required, e.g. `plugins/beacon`.
- `[mock-dir-name | all]`: optional. Which subfolders of `mocks/` to add to `mock_dirs` (each holds flows):
  - a folder name (e.g. `beacon`): add just that one.
  - `all`: add every subfolder of `mocks/`, excluding `node_modules` and hidden folders.
  - omitted: ask the user which ones (step 1).
- `--skip-git-prompt`: optional. Skips step 9 (the git add question). Used when another skill will ask instead.

## Steps

1. **Resolve paths and mock dirs.** `BUILD = <parent-dir>/mocks/BUILD`. If `BUILD` is missing, stop and tell the user. Read it in full first. Then set `DIRS` (the folders to put in `mock_dirs`):
   - folder name given: `DIRS = [that folder]` (it must exist under `<parent-dir>/mocks/`, else stop and say so).
   - `all`: `DIRS` = all subfolders of `<parent-dir>/mocks/` (excluding `node_modules` and hidden folders). If there are none, stop and say so.
   - omitted: list the subfolders of `<parent-dir>/mocks/` (same exclusions, and skipping any already in an existing `mock_dirs`), then **ask the user (AskUserQuestion, multiSelect)** which to add. `AskUserQuestion` shows at most 4 options: with more than 4 candidates, offer the first 3 plus "All of them" and mention they can type other names under "Other". If there are no candidates, stop and say so.
   - `RENAME_NAME` (used only if a `mocks` filegroup must be renamed, step 3) = the folder name when exactly one dir was given by name, otherwise `basename(<parent-dir>)`.

2. **Skip what exists.** Check each of the following and only add what is absent; never duplicate or overwrite:
   - `load("@npm//:defs.bzl", "npm_link_all_packages")`
   - `load("@rules_player//player:defs.bzl", create_base_dsl_config = "create_base_config", compile_mocks = "compile_mocks")`
   - `npm_link_all_packages(name = "node_modules")`
   - `create_base_dsl_config(name = "dsl_config", ...)`
   - `compile_mocks(name = "mocks", ...)`
     If `compile_mocks` already exists, add each missing entry of `DIRS` to its `mock_dirs`, then stop.

3. **Rename a conflicting filegroup.** The `compile_mocks` target must be named exactly `mocks`. If a `filegroup` (or any other rule) is already named `"mocks"`, rename it to `RENAME_NAME`. If a target named `RENAME_NAME` already exists, stop and ask the user for another name. Leave its `srcs` and `visibility` unchanged.

4. **Add the targets** after the `load` lines, before the existing rules, formatted like `plugins/reference-assets/mocks/BUILD`:

   ```python
   load("@npm//:defs.bzl", "npm_link_all_packages")
   load("@rules_player//player:defs.bzl", create_base_dsl_config = "create_base_config", compile_mocks = "compile_mocks")

   npm_link_all_packages(name = "node_modules")

   create_base_dsl_config(
       name = "dsl_config",
       presets = [
           ":node_modules/@player-ui/reference-assets-cli-preset",
       ],
   )

   compile_mocks(
       name = "mocks",
       mock_dirs = [
           "<dir>",  # one line per entry in DIRS
       ],
       dsl_config = ":dsl_config",
       data = [
           ":node_modules/@player-ui/reference-assets-cli-preset",
           ":node_modules/@player-ui/reference-assets-plugin-components",
       ],
       cli = "@player-cli/cli",
       dsl_package = "@player-lang/react-dsl"
   )
   ```

   If other `load` lines exist, merge into them rather than duplicating.

5. **Ensure `<parent-dir>/mocks/package.json` exists** (required by `npm_link_all_packages`). If missing, create it:

   ```json
   {
     "name": "@player-ui/<basename>-plugin-mocks",
     "version": "0.0.0-PLACEHOLDER",
     "dependencies": {
       "@player-ui/reference-assets-cli-preset": "workspace:^",
       "@player-ui/reference-assets-plugin-components": "workspace:^"
     }
   }
   ```

   A new `package.json` needs `pnpm install` (repo root) to register the package and update `pnpm-lock.yaml`; without it `bazel build` fails with `npm_link_all_packages() ... may only be called in bazel packages that correspond to the pnpm root package`. **Ask the user (AskUserQuestion) whether to run `pnpm install` now.** Run it only if they say yes; if they decline, skip it and note it as still required in the final report. Never run it without an explicit yes.

6. **Check references to the renamed target.** If a filegroup was renamed, `grep -rn "<parent-dir>/mocks:mocks\|<parent-dir>/mocks\"" ` (BUILD, bzl, package files) for consumers. Anything that used `:mocks` as the old JSON filegroup now gets compiled output instead. Report those; update them to `:RENAME_NAME` only if the user asks.

7. **Verify.** Run `bazel build //<parent-dir>/mocks:mocks`. Report success or the first real error. A BuildBuddy "Build Event Protocol upload failed" line is unrelated to the build result. If `pnpm install` was declined or not yet run and the build fails with the `npm_link_all_packages` error, say that is the cause rather than a BUILD mistake.

8. **Final report (always end with this).** State explicitly, as separate lines:
   - **package.json:** "Added `<parent-dir>/mocks/package.json`" (new file) or "package.json already existed, not changed".
   - **Filegroup rename:** output this **only if a rename occurred**; otherwise omit the line entirely (no "nothing renamed" note). Show the new and old definitions in this format, then list any consumers found in step 6 that now resolve `:mocks` to compiled output:

     ```
     filegroup(
         name = "<NEW NAME>",
         ...
     )
     # previously
     filegroup(
         name = "mocks",
         ...
     )
     ```

   - **pnpm install:** ran / declined / not needed.
   - \*\*Build result.

9. **Offer to add new files to git.** **Skip this step entirely if the args include `--skip-git-prompt`** (set by `/mocks-json-to-dsl`, which asks once for all new files). Otherwise, after the report, list the **new (untracked)** files this run created (typically `<parent-dir>/mocks/package.json`; check with `git status --short <parent-dir>`). If there are none, skip this step. Otherwise **ask the user (AskUserQuestion)** whether to `git add` them, naming the files. Run `git add <those files>` only on an explicit yes; add only the files you listed (not modified files, not `pnpm-lock.yaml`, no `git add -A`). Never commit.

## Notes

- Do not touch `.tsx` flow files.
- `mock_dirs` entries are subfolders of `mocks/` containing `.tsx` flows. Never create `mocks/<dir>/` folders; only existing ones can be added. In the BUILD, write one plain `"<dir>",` line per entry (the `# one line per entry` comment in the template is a note, not content).
- Keep the final report concise but never omit the package.json line, and include the filegroup block only when a rename occurred.
