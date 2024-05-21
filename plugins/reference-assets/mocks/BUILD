load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@rules_player//player:defs.bzl", create_base_dsl_config = "create_base_config")
load("//tools/mocks:generate_dsl_targets.bzl", "generate_all_dsl_mocks")

npm_link_all_packages(name = "node_modules")

create_base_dsl_config(
    name = "dsl_config",
    presets = [
        ":node_modules/@player-ui/reference-assets-cli-preset",
    ],
)

MOCK_DIRS = [
    "action",
    "collection",
    "image",
    "info",
    "input",
    "text",
]

DSL_SRCS = glob(["{}/*.tsx".format(d) for d in MOCK_DIRS])

generate_all_dsl_mocks(MOCK_DIRS)

filegroup(
    name = "compiled_mocks",
    srcs = [":dsl_mocks_" + mock_dir for mock_dir in MOCK_DIRS],
)

filegroup(
    name = "json_mocks",
    srcs = glob(
        ["**/*.json"],
        exclude = ["package.json"],
    ),
)

filegroup(
    name = "mocks",
    srcs = [
        ":compiled_mocks",
        ":json_mocks",
    ],
    visibility = ["//visibility:public"],
)
