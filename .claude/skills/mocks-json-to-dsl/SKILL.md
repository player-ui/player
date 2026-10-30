---
name: mocks-json-to-dsl
description: Convert a Player flow JSON file into a DSL (.tsx) flow, build it with bazel, diff the compiled JSON against the original, and iterate (max 5 rebuilds). Use when asked to convert/rewrite a mock JSON as DSL/TSX, e.g. /mocks-json-to-dsl plugins/beacon/mocks/beacon/beacon-action.json.
---

# JSON flow -> DSL (.tsx)

Args: `<path-to-flow.json>` (required). Optional: output `.tsx` path (default: same dir, same basename, `.tsx`).

## Prerequisites

1. **Validate the path format.** The JSON must live at `<parent-dir>/mocks/<mock-dir>/<name>.json`, with a `BUILD` file at `<parent-dir>/mocks/BUILD` (e.g. `plugins/beacon/mocks/beacon/beacon-action.json` + `plugins/beacon/mocks/BUILD`). If the path is not in a `mocks/<mock-dir>/` folder, or `mocks/BUILD` does not exist, **stop** and tell the user the required format (the layout above). Do not create folders or BUILD files.
2. **Check for the compile target.** `mocks/BUILD` must have `compile_mocks(name = "mocks", ...)` whose `mock_dirs` includes `<mock-dir>`.
   - If it does, continue.
   - If the path and BUILD are valid but the target (or the `<mock-dir>` entry) is missing, **ask the user (AskUserQuestion)** whether to run `/mocks-add-dsl-targets-to-build <parent-dir>` now. If yes, run it via the Skill tool (passing `<parent-dir>`, always `<mock-dir>` as the second arg (so the user is not asked to choose), and always `--skip-git-prompt` so the git question is asked once, in Step 5), then continue. If no, stop and say the conversion needs that target to build.

- Keep the original JSON where it is. Never overwrite or delete it: it is the reference for comparison.

## Step 1: Reference material (consult as needed, not a read-everything step)

Use these to confirm a mapping before writing, and again whenever a rebuild shows a discrepancy or compile error. Read only what the current JSON needs.

- **Components, slots, prop types:** `plugins/reference-assets/components/src/index.tsx` (`Action`, `Text`, `Collection`, `Input`, `Choice`, `Info`, `Image`, `ChatMessage`, ...; slots like `Action.Label`, `Collection.Values`). Do not assume props not defined there.
- **Existing `.tsx` mocks as examples:** `plugins/reference-assets/mocks/<type>/*.tsx` (and other `plugins/*/mocks/**/*.tsx`). Find ones that use the same asset types, props or constructs as the JSON (`grep -rln "<Input" plugins/*/mocks --include=*.tsx`), and match their import style, comment density and formatting. Prefer an existing example over inventing a pattern.
- **DSL internals (when behaviour is unclear):** the installed `@player-lang/react-dsl` source under `node_modules/.pnpm/@player-lang+react-dsl*/node_modules/@player-lang/react-dsl/src`, e.g. how `expression`/`binding` templates render.
- **Docs:** `docs/site/src/content/docs/authoring/` (`views.mdx`, `schema.mdx`).

When a rebuild produces a discrepancy or compile error, look for a mock example or the reference above that handles the same construct **before** guessing a fix.

## Step 2: Conversion rules

Apply per JSON section. Confirm uncertain mappings against the Step 1 references.

| JSON                                                                          | DSL                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `"id"` (flow)                                                                 | `flow.id`, copied                                                                                                                                                                                                                                                                                                                                                                                                               |
| `views[i]` (`type: "x"`)                                                      | the matching component element (`type: "action"` -> `<Action>`). Define each as `const viewN = (...)`                                                                                                                                                                                                                                                                                                                           |
| view/asset `id`                                                               | `id="..."` prop. If omitted in JSON, omit in DSL (the compiler generates ids)                                                                                                                                                                                                                                                                                                                                                   |
| scalar props (`value`, `metaData`, ...)                                       | same-named props. Objects stay objects (`metaData={{ ... }}`)                                                                                                                                                                                                                                                                                                                                                                   |
| nested `{ "asset": {...} }` in a named slot (`label`, `values`, `title`, ...) | slot component (`<Action.Label>`, `<Collection.Values>`, ...), containing the child component                                                                                                                                                                                                                                                                                                                                   |
| text asset with only `value`                                                  | slot children as plain text, or an explicit `<Text>` when the id matters (below)                                                                                                                                                                                                                                                                                                                                                |
| array slot (`values`, `actions`, `items`)                                     | slot with several children, in order                                                                                                                                                                                                                                                                                                                                                                                            |
| `"{{path}}"` binding inside a string                                          | a binding const: `const path = b\`path\`` (`binding as b`), interpolated as `${path}`in template literals or`{path}` in JSX children                                                                                                                                                                                                                                                                                            |
| `exp` string / array (no `@[ ]@` wrapper)                                     | `e\`...\`` (`expression as e`), one template per string; arrays stay arrays. Bindings inside use `${binding}`                                                                                                                                                                                                                                                                                                                   |
| `exp` string wrapped as `"@[ ... ]@"`                                         | `e` and the `exp` prop cannot produce this: `e` only adds `@[ ]@` when nested in a string, and it adds **no spaces** (`@[x]@`, not `@[ x ]@`); `@` inside `e\`...\``is a compile error. Omit the`exp`prop and use a child`<property name="exp">{"@[ ... ]@"}</property>`with the literal string, exactly as in the JSON. If the JSON has no spaces inside the brackets,`{\`${e\`...\`}\`}`produces it and keeps the`e` template |
| `data`                                                                        | `flow.data`, copied verbatim                                                                                                                                                                                                                                                                                                                                                                                                    |
| `schema`                                                                      | **Only** if the JSON has a `schema`: declare `const schema = {...}` + `makeBindingsForObject(schema)` and set `flow.schema`. If the JSON has no `schema`, use plain `b\`...\``bindings;`makeBindingsForObject`adds a`schema` block that will not match                                                                                                                                                                          |
| `navigation`                                                                  | `flow.navigation`, copied verbatim, except each `ref: "<view id>"` becomes `ref: viewN` (the element)                                                                                                                                                                                                                                                                                                                           |
| other top-level keys                                                          | copy onto the `DSLFlow` object                                                                                                                                                                                                                                                                                                                                                                                                  |

Principles:

1. **Mirror the JSON structure**; one JSON node -> one DSL node. Do not refactor, factor out helpers or add features the JSON lacks.
2. **Preserve values exactly**: strings, casing (e.g. `outcome: "done"` vs `"DONE"`), numbers, key presence.
3. **Auto-generated ids**: the compiler names nested assets (`action-label`, `values-0`, ...). If the JSON has a different id on a nested asset, render that asset as an explicit component with `id` (e.g. `<Text id="action-label-text">`) instead of bare text.
4. **Do not add** schema, ids or props the JSON does not have.
5. Key order and whitespace do not matter; content does.
6. Match the style of the surrounding code (imports, formatting, comments).

## Step 3: Write, build, compare (max 5 rebuilds)

1. Write the `.tsx`.
2. Build: `bazel build //<mocks-package>:mocks` (e.g. `//plugins/beacon/mocks:mocks`). A BuildBuddy "Build Event Protocol upload failed" line is unrelated. If the build fails on a **different** file, check whether the compile of yours succeeded (the log shows `Compiling <your>.tsx`, and an `✖ Error compiling` line names the failing file); report unrelated failures rather than fixing them.
3. Locate the output: `bazel-bin/<mocks-package>/<mock-dir>/<basename>.json`.
4. Compare: `diff <(jq -S . <original.json>) <(jq -S . <compiled.json>)`. Empty diff = success. Ignore the known unavoidable discrepancies below when judging success, but always report them.
5. On a diff, consult the Step 1 references (look for a mock example using the same construct), then adjust the `.tsx` using the rules above (typical fixes: extra `schema` -> switch to `b\`\``; differing nested id -> explicit `id`; wrong `ref`/casing), then rebuild and compare again.
6. Stop on success, or after the 5th rebuild (1 initial build + up to 5 rebuilds). Do not loop on the same unchanged diff: if a discrepancy cannot be fixed from the DSL (e.g. the compiler cannot produce that id), stop early and report it.

### Known unavoidable discrepancies

Do not rebuild to "fix" these; they cannot be changed from the `.tsx`.

- **`"views": []` added when the original JSON has no `views` key** (e.g. flows that are only `navigation` + `data`, like `external-state`). The compiler always sets `views`: in `@player-lang/react-dsl` `src/compiler/compiler.ts`, `copiedValue.views = (await Promise.all(copiedValue?.views?.map(...) ?? []))`, where `?? []` turns a missing `views` into `[]` and the assignment writes it. Player treats an empty `views` the same as none. Diff looks like `27c27,28 < } --- > }, > "views": []`.

## Step 4: Report (concise)

- **Success:** "Compiled JSON is identical to the original" + the `.tsx` path + number of rebuilds used.
- **Success with unavoidable discrepancy:** if the only remaining diff is a known unavoidable discrepancy, say "Identical except for ..." and **include it in the final output** with the reason, e.g. "`views: []` added. Unavoidable: the compiler always writes `views` (`compiler.ts` `copiedValue.views = ... ?? []`), so a flow without views gets an empty array. Harmless to Player." Do not present it as a failure and do not use rebuilds on it.
- **Not identical:** list each remaining discrepancy as `path: original -> compiled` (jq diff lines), what was tried, and why it could not be fixed. Include any known unavoidable discrepancy here too, labelled as unavoidable with its reason.
- Always state the paths of the `.tsx` written and the compiled JSON checked.

## Step 5: Offer to add new files to git

After the report, list the **new (untracked)** files this run created: the `.tsx`, plus anything `/mocks-add-dsl-targets-to-build` created if it ran (e.g. `mocks/package.json`); check with `git status --short <parent-dir>`. **Ask the user (AskUserQuestion)** whether to `git add` them, naming the files. Run `git add <those files>` only on an explicit yes; add only the files you listed (not modified files, not `pnpm-lock.yaml`, no `git add -A`). Never commit. Do this even when the build was not identical, since the `.tsx` still exists.

## Notes

- Never edit or delete the original JSON, BUILD files or other mocks.
- Do not run `pnpm install` from this skill.
