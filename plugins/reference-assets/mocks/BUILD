load("@aspect_rules_js//npm:defs.bzl", "npm_package")
load("@aspect_rules_js//js:defs.bzl", "js_library")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("@rules_player//player:defs.bzl", create_base_dsl_config = "create_base_config")
load("generate_dsl_targets.bzl", "generate_all_dsl_mocks")

npm_link_all_packages(name = "node_modules")

create_base_dsl_config(
    name = "dsl_config",
    plugins = [
        ":node_modules/@player-ui/reference-assets-cli-plugin",
    ],
)

DSL_SRCS = glob([
    "action/*.tsx",
    "collection/*.tsx",
    "image/*.tsx",
    "info/*.tsx",
    "input/*.tsx",
    "text/*.tsx",
])

MOCK_DIRS = [
    "action",
    "collection",
    "image",
    "info",
    "input",
    "text",
]

generate_all_dsl_mocks(MOCK_DIRS)

filegroup(
    name = "all_flows",
    srcs = [":dsl_mocks_" + mock_dir for mock_dir in MOCK_DIRS],
)

# compile_dsl(
#     name = "all_flows",
#     srcs = DSL_SRCS,
#     config = ":dsl_config",
#     data = [
#         ":node_modules/@player-ui/reference-assets-cli-plugin",
#         ":node_modules/@player-ui/reference-assets-plugin-components",
#         "//:node_modules/@player-tools/dsl",
#         "//:node_modules/@types/react",
#         "//:node_modules/dlv",
#         "//:node_modules/react",
#     ],
#     skip_test = True,
# )

# generate_manifest(
#     name = "mocks",
#     mocks = glob(["**/*.json"]),
#     visibility = ["//visibility:public"],
# )

filegroup(
    name = "mock-files",
    srcs = glob(["**/*.json"]) + [":all_flows"],
)

js_library(
    name = "mocks-js-library",
    srcs = [":mock-files"],
)

npm_package(
    name = "mocks",
    srcs = [":mocks-js-library"] + DSL_SRCS,
    visibility = ["//visibility:public"],
)

# javascript_pipeline(
#     name = "@player-ui/reference-assets-plugin-mocks",
#     entry = "index.ts",
#      dependencies = [
#         "@npm//@player-tools/dsl",
#         "//plugins/reference-assets/components:@player-ui/reference-assets-components"
#     ],
#     other_srcs = [
#         "index.ts",
#         ":mocks",
#     ] + glob(["**/*.tsx"]),
#     out_dir = "",
# )

# java_library(
#     name = "jar",
#     resources = [":mocks"],
#     resource_strip_prefix = "plugins/reference-assets/mocks",
#     visibility = ["//visibility:public"],
# )
