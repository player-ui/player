load(":generate_dsl_targets.bzl", "generate_all_dsl_mocks")
load(":generate_mocks_manifest.bzl", "generate_mocks_manifest")

PLUGIN_MOCKS = [
    "beacon",
    "external-action",
    "pubsub",
    "reference-assets",
]

filegroup(
    name = "mocks",
    srcs = ["//plugins/{}/mocks".format(plugin) for plugin in PLUGIN_MOCKS],
)

generate_mocks_manifest(
    name = "manifest",
    mocks = [":mocks"],
)

java_library(
    name = "jar",
    resource_strip_prefix = "tools",
    resources = [":manifest"],
    visibility = ["//visibility:public"],
)
