# PlayerUI Typescript Development Guide

### Sections:
1. [Setup](#Setup)
2. [Adding a new plugin](#adding-a-new-plugin)
3. [Dependencies](#Dependencies)

## Setup
### Demo Application
The demo app can be built and launched from the command line with bazel:
```bash
bazel build //docs/site:site
bazel run //docs/site:site
```

## Adding a new plugin
Adding a new plugin is simple using predefined macros for `BUILD.bazel` files.

### Core vs React Plugins
Core plugins provide shared functionality, usable on all platforms i.e. as Player Core runs on every platform, any core Player plugin will also run on every platform which allows for shared functionality to be authored once and shared across every platform.

React plugins add react specific functionality.

### Scaffold
All plugins follow a common structure:

The basic structure is as follows:
```bash
plugins/example
├── react
│   ├── BUILD.bazel
│   ├── src
│   │   ├── index.tsx
│   │   └── __tests__
│   │       └── index.test.tsx
│   └── package.json
└── core
    ├── BUILD.bazel
    ├── src
    │   ├── index.ts
    │   └── __tests__
    │       └── index.test.ts
    └── package.json
```

To scaffold your plugin, create a new `core` or `react` folder in the appropriate plugin directory, with the appropriate folders, a package.json and a blank `BUILD.bazel`:

For core plugins:
```bash
mkdir -p plugins/example-plugin/core/src
cd plugins/example-plugin/core
pnpm init
touch BUILD.bazel
```

For react plugins:
```bash
mkdir -p plugins/example-plugin/react/src
cd plugins/example-plugin/react
pnpm init
touch BUILD.bazel
```

Set the name, version, and entry point of the package in the `package.json`:

For core plugins:
```javascript
{
  "name": "@player-ui/example-plugin-core",
  "version": "0.0.0-PLACEHOLDER",
  "main": "src/index.ts",
}
```

For react plugins:
```javascript
{
  "name": "@player-ui/example-plugin-react",
  "version": "0.0.0-PLACEHOLDER",
  "main": "src/index.tsx",
}
```

> [!NOTE]
> The package follows a naming convemtion of `@player-ui/{description}-plugin-{platform}`.

### BUILD
The `js_pipeline` macro will handle the full build:

```python
load("@rules_player//javascript:defs.bzl", "js_pipeline")

js_pipeline(package_name = "@player-ui/example-plugin-core")
```

In order to use the `tsup` bundler, add `tsup_config` to the `BUILD.bazel` file. This is done by loading the `tsup_config` helper from the `tools` package and calling it within `BUILD.bazel`:

```python
load("//tools:defs.bzl", "tsup_config")

tsup_config(name = "tsup_config")
```

All plugins leverage `vitest` for testing. To use `vitest`, add `vitest_config` to the `BUILD.bazel` file. This is done by loading the `vitest_config` helper from the `tools` package and calling it within `BUILD.bazel`: 

```python
load("//tools:defs.bzl", "...", "vitest_config")

vitest_config(name = "vitest_config")
```

## Dependencies
Since each package can have different external dependencies, they each need to have their own node_modules. `pnpm` supports a single lock file for multiple packages by setting up a `pnpm-workspace.yaml`. The resulting lock file can be used by `rules_js` to set up a Bazel workspace with multiple packages that each get their own `node_modules` folder in the bin tree. The `npm_link_all_packages` rule will automatically set up the correct node_modules folder based on the Bazel package name and the `pnpm-lock.yaml`. Add the following to your `BUILD.bazel` file.

```python
load("@npm//:defs.bzl", "npm_link_all_packages")

npm_link_all_packages(name = "node_modules")
```

`js_pipeline` takes `deps`, `test_deps`, and `peer_deps` to allow specifying dependencies:

```python
js_pipeline(
    package_name = "@player-ui/example-plugin-core",
    peer_deps = [
        "//:node_modules/react",
    ],
    deps = [
        ":node_modules/@player-ui/react-subscribe",
    ],
    test_deps = [
        ":node_modules/@player-ui/common-types-plugin",
    ],
)
```

> [!NOTE]
> External dependencies are specified as such `//:node_modules/...` with the leading `//`, while internal dependencies are specified as such `:node_modules/...` without the leading `//`.

Internal dependencies also need to be added to the `package.json` either as a dependency, dev dependency, or peer dependency:

```javascript
{
  ...
  "dependencies": {
    "@player-ui/react-subscribe": "workspace:*",
  },
  "devDependencies": {
    "@player-ui/common-types-plugin": "workspace:*",
  }
  ...
}
```

Add the new package's `node_modules` directory to `.bazelignore`:

`plugins/example-plugin/core/node_modules`
