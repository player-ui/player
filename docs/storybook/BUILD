load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:storybook/package_json.bzl", storybook_bin = "bin")

npm_link_all_packages(
    name = "node_modules",
)

deps = [
    ":node_modules/@player-ui/common-types-plugin",
    ":node_modules/@player-ui/make-flow",
    ":node_modules/@player-ui/reference-assets-plugin",
    ":node_modules/@player-ui/reference-assets-plugin-react",
    ":node_modules/@player-ui/mocks",
    ":node_modules/@player-ui/reference-assets-plugin-components",
    ":node_modules/@player-ui/data-change-listener-plugin",
    ":node_modules/@player-ui/computed-properties-plugin",
    ":node_modules/@player-ui/react",
    ":node_modules/@player-ui/storybook",
    ":node_modules/@player-ui/async-node-plugin",
    ":node_modules/@player-ui/expression-plugin",
    ":node_modules/@player-ui/player",
    "//:node_modules/typescript",
    "//:node_modules/@babel/preset-typescript",
    "//:node_modules/@babel/preset-env",
    "//:node_modules/@storybook/react-vite",
    "//:node_modules/@storybook/addon-docs",
    "//:node_modules/@vitejs/plugin-react",
    "//:node_modules/react-is",
    "//:node_modules/@types/hoist-non-react-statics",
    "//:node_modules/hoist-non-react-statics",
    "//:node_modules/@types/react-redux",
    "//:node_modules/react-redux",
    "//:node_modules/redux-state-sync",
    "//:node_modules/lz-string",
    "//:node_modules/dequal",
    "//:node_modules/uuid",
    "//:node_modules/clsx",
    "//:node_modules/semver",
    "//:node_modules/@babel/runtime",
    "//:node_modules/@player-tools/dsl",
    "//:node_modules/@reduxjs/toolkit",
    "//:node_modules/@monaco-editor/react",
    "//:node_modules/esbuild-wasm",
    "//:node_modules/@devtools-ds/table",
    "//:node_modules/dlv",
    "//:node_modules/ts-loader",
    "//:node_modules/tslib",
    "//:node_modules/react",
    "//:node_modules/react-dom",
     "//:node_modules/prop-types",
    "//:typings",
    "tsconfig.json",
    "package.json",
    "vite.config.mts",
]

storybook_bin.storybook(
    name = "storybook",
    srcs = glob(include = [
        "src/**/*",
        ".storybook/*",
    ]) + deps,
    args = [
        "build",
        "--output-dir",
        "./storybook",
        "--debug",
        "--disable-telemetry",
    ],
    chdir = package_name(),
    env = {
        "CACHE_DIR": ".cache",
    },
    out_dirs = ["storybook"],
    visibility = ["//visibility:public"],
)

storybook_bin.storybook_binary(
    name = "start",
    args = [
        "dev",
        "--no-open",
        "--port",
        "6006",
        "--debug",
        "--disable-telemetry",
    ],
    chdir = package_name(),
    data = glob(include = [
        "src/**/*",
        ".storybook/*",
    ]) + deps,
    tags = [
        "ibazel_notify_changes",
    ],
    visibility = ["//visibility:public"],
)
