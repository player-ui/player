load(":generate_dsl_targets.bzl", "generate_all_dsl_mocks")
load(":generate_mocks_manifest.bzl", "generate_mocks_manifest")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")

PLUGIN_MOCKS = [
    "beacon",
    "external-action",
    "pubsub",
    "reference-assets",
]

filegroup(
    name = "all_mocks",
    srcs = ["//plugins/{}/mocks".format(plugin) for plugin in PLUGIN_MOCKS],
)

generate_mocks_manifest(
    name = "manifest",
    mocks = [":all_mocks"],
)

npm_package(
    name = "mocks",
    visibility = ["//visibility:public"],
    package = "@player-ui/mocks",
    srcs = [
        ":manifest",
        "package.json"
    ],
    tags = ["do-not-publish"],
)

java_library(
    name = "jar",
    resource_strip_prefix = "tools",
    resources = [":manifest"],
    visibility = ["//visibility:public"],
)
