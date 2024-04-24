load("@npm//:defs.bzl", "npm_link_all_packages")
load("@npm//:storybook/package_json.bzl", storybook_bin = "bin")

npm_link_all_packages(
    name = "node_modules",
)

deps = [
    ":node_modules/@player-ui/common-types-plugin",
    ":node_modules/@player-ui/make-flow",
    ":node_modules/@player-ui/reference-assets-plugin-react",
    ":node_modules/@player-ui/reference-assets-plugin-mocks",
    ":node_modules/@player-ui/reference-assets-plugin-components",
    ":node_modules/@player-ui/data-change-listener-plugin",
    ":node_modules/@player-ui/computed-properties-plugin",
    ":node_modules/@player-ui/react",
    ":node_modules/@player-ui/storybook-addon-player",
    "//:node_modules/@babel/preset-typescript",
    "//:node_modules/@babel/preset-env",
    "//:node_modules/@storybook/react-webpack5",
    "//:node_modules/raw-loader",
    "//:node_modules/react",
    "//:node_modules/react-dom",
    "//:typings",
    "tsconfig.json",
    "package.json",
    "babel.config.json",
]

storybook_bin.storybook(
    name = "storybook",
    srcs = glob(include = [
        "src/**/*",
        ".storybook/*",
    ]) + deps,
    args = [
        "build",
        "--config-dir",
        "./docs/storybook/.storybook",
        "--output-dir",
        "$(@D)",
        "--loglevel",
        "verbose",
    ],
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
    ],
    chdir = "docs/storybook",
    data = glob(include = [
        "src/**/*",
        ".storybook/*",
    ]) + deps,
    tags = [
        # "ibazel_notify_changes",
    ],
    visibility = ["//visibility:public"],
)
