# Player CLI

## Config

Config files are able to customize the behavior of the CLI commands without requiring args. Behavior specific to execution can leverage `plugins`, which can be composed together using `presets`. Full configs can also be shared using `extensions`.

To resolve a full configuration, the `extension` is taken as the base, the `presets` are applied in order, then local `plugins`.
The format is similar to `eslint`, `babel` and other .rc/json/js based approaches.

Config files are searched using cosmiconfig, which will look for:

- a `player` property in package.json
- a `.playerrc` file in JSON or YAML format
- a `.player.json`, `.playerrc.yaml`, `.playerrc.yml`, `.playerrc.js`, or `.playerrc.cjs` file
- a `player.config.js` or `player.config.cjs` CommonJS module exporting an object

Example:

```js
module.exports = {
  extends: '@my-scope/base',
  plugins: [
    'plugin-npm-package',
    ['some-plugin-with-config', { config: true }],
    {
      // Plugins can also be defined inline
      handler: () => {},
    },
  ],
};
```

Options defined via the CLI arguments will take precedence over the config files (for things that overlap).

## Plugins

Plugins are the way to change runtime behavior of the CLI actions. This includes augmenting the behavior of the DSL compiler, language-service, and more.

# Commands

<!-- commands -->

- [`player dsl compile`](#player-dsl-compile)

## `player dsl compile`

Compile Player DSL files into JSON

```
USAGE
  $ player dsl compile -i <value> [-c <value>] [-o <value>] [--skip-validation]

FLAGS
  -c, --config=<value>  Path to a specific config file to load.
                        By default, will automatically search for an rc or config file to load
  -i, --input=<value>   (required) An input directory to compile.
                        Any jsx/ts/tsx files will be loaded via babel-require automatically.
  -o, --output=<value>  [default: _out] Output directory to write results to
  --skip-validation     Option to skip validating the generated JSON

DESCRIPTION
  Compile Player DSL files into JSON
```

<!-- commandsstop -->
