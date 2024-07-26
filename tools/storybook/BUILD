load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@aspect_rules_js//js:defs.bzl", "js_binary", "js_library")
load("@rules_player//javascript:defs.bzl", "create_package_json")
load("@npm//:tsup/package_json.bzl", tsup_bin = "bin")
load("@npm//:defs.bzl", "npm_link_all_packages")

npm_link_all_packages(
    name = "node_modules",
)

name = "storybook"

dependencies = [
    ":node_modules/@player-ui/react",
    ":node_modules/@player-ui/beacon-plugin-react",
    ":node_modules/@player-ui/make-flow",
    ":node_modules/@player-ui/metrics-plugin-react",
    "//:node_modules/@storybook/manager-api",
    "//:node_modules/@storybook/preview-api",
    "//:node_modules/@storybook/types",
    "//:node_modules/@storybook/components",
    "//:node_modules/@player-tools/xlr",
    "//:node_modules/@player-tools/xlr-utils",
    "//:node_modules/@types/react-redux",
    "//:node_modules/react-redux",
    "//:node_modules/redux-state-sync",
    "//:node_modules/lz-string",
    "//:node_modules/dequal",
    "//:node_modules/@babel/preset-typescript",
    "//:node_modules/@babel/preset-env",
    "//:node_modules/uuid",
    "//:node_modules/clsx",
    "//:node_modules/@player-tools/dsl",
    "//:node_modules/@reduxjs/toolkit",
    "//:node_modules/@monaco-editor/react",
    "//:node_modules/esbuild-wasm",
    "//:node_modules/@devtools-ds/table",
    "//:node_modules/dlv",
    "//:node_modules/ts-loader",
    "//:node_modules/tslib",
]

dev_dependencies = [
    "//:node_modules/tsup",
]

peer_deps = [
    "//:node_modules/typescript",
    "//:node_modules/@storybook/manager",
    "//:node_modules/@storybook/preview",
]

tsup_name = name + "_tsup"

tsup_target = ":" + tsup_name

tsup_bin.tsup_node(
    name = tsup_name,
    srcs = glob(["src/**"]) + [
        "package.json",
        "tsconfig.json",
        "tsup.config.ts",
    ] + dependencies + dev_dependencies + peer_deps,
    outs = [
        "dist/index.js",
        "dist/index.mjs",
    ],
    args = [
    ],
    chdir = package_name(),
)

package_json_name = name + "_package_json"

package_json_target = ":" + package_json_name

create_package_json(
    name = package_json_name,
    base_package_json = "package.json",
    custom_entrypoints = True,
    dependencies = dependencies,
    peer_dependencies = peer_deps,
    root_package_json = "//:package.json",
    stamp = -1,
    substitutions = {
        "0.0.0-PLACEHOLDER": "{STABLE_VERSION}",
    },
)

library_name = name + "_library"

library_target = ":" + library_name

js_library(
    name = library_name,
    srcs = glob(["src/**"]) + [
        "manager.mjs",
        "preview.mjs",
        tsup_target,
        package_json_target,
    ],
    deps = dependencies,
)

pkg_name = name

pkg_target = ":" + pkg_name

npm_package(
    name = pkg_name,
    srcs = [
        library_target,
        "manager.mjs",
        "preview.mjs",
    ],
    allow_overwrites = True,
    package = "@player-ui/storybook",
    replace_prefixes = {
        package_json_name: "package",
    },
    visibility = ["//visibility:public"],
)

js_binary(
    name = name + ".npm-publish",
    chdir = package_name() + "/" + pkg_name,
    data = [pkg_target],
    entry_point = "@aspect_rules_js//npm/private:npm_publish_mjs",
    # required to make npm to be available in PATH
    include_npm = True,
)
