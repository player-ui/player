load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@npm//:tsup/package_json.bzl", tsup_bin = "bin")
load("@npm//:defs.bzl", "npm_link_all_packages")

npm_link_all_packages(
    name = "node_modules",
)

dependencies = [
    "//:node_modules/@storybook/manager-api",
    "//:node_modules/@storybook/preview-api",
    "//:node_modules/@storybook/types",
    ":node_modules/@player-ui/react",
    ":node_modules/@player-ui/beacon-plugin-react",
    ":node_modules/@player-ui/make-flow",
    ":node_modules/@player-ui/metrics-plugin-react",
]

dev_dependencies = [
    "//:node_modules/tsup",
    "//:node_modules/typescript",
    "//:node_modules/@storybook/manager",
    "//:node_modules/@storybook/preview",
]

tsup_bin.tsup_node(
    name = "addon-storybook-tsup",
    srcs = glob(["src/**"]) + [
        "package.json",
        "tsconfig.json",
        "tsup.config.ts",
    ] + dependencies + dev_dependencies,
    outs = [
        "dist/index.js",
        "dist/index.mjs",
    ],
    args = [
    ],
    chdir = package_name(),
)

js_library(
    name = "addon-storybook-library",
    srcs = glob(["src/**"]) + [
        "manager.mjs",
        "package.json",
        "preview.mjs",
        ":addon-storybook-tsup",
    ],
)

npm_package(
    name = "addon-storybook",
    srcs = [
        ":addon-storybook-library",
        ":addon-storybook-tsup",
    ],
    package = "@player-ui/storybook-addon-player",
    visibility = ["//visibility:public"],
)
