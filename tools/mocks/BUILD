load("@rules_java//java:java_library.bzl", "java_library")
load("@rules_player//player:defs.bzl", generate_mocks_manifest = "generate_mocks_manifest")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")

PLUGIN_MOCKS = [
    "beacon",
    "external-action",
    "pubsub",
    "reference-assets",
]
filegroup(
    name = "all_mocks",
    srcs = ["//plugins/{}/mocks".format(plugin) for plugin in PLUGIN_MOCKS] + [
        "//plugins/reference-assets/mocks:flow-manager",
        # a2ui mocks live alongside a js_pipeline so the directory-level
        # `mocks` target is the npm_package; the raw JSONs are at `:snapshots`.
        "//plugins/a2ui/mocks:snapshots",
    ],
    visibility = ["//visibility:public"],
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

# TODO: This is being bundled where-ever relied on,
#  should publish or not include in transitive scope
java_library(
    name = "jar",
    resource_strip_prefix = "tools",
    resources = [":manifest"],
    visibility = ["//visibility:public"],
)
