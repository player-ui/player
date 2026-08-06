load("@rules_java//java:java_library.bzl", "java_library")
load("@rules_player//player:defs.bzl", generate_mocks_manifest = "generate_mocks_manifest")
load("@aspect_rules_js//npm:defs.bzl", "npm_package")

# DO NOT put reference-assets in here. Those are asset mocks
PLUGIN_MOCKS = [
    "beacon",
    "external-state",
    "pubsub",
    "pending-transaction"
]
filegroup(
    name = "all_mocks",
    srcs = ["//plugins/{}/mocks".format(plugin) for plugin in PLUGIN_MOCKS + ["reference-assets"]] + [
        "//plugins/reference-assets/mocks:flow-manager",
    ],
    visibility = ["//visibility:public"],
)

# --- START iOS --- #
# These are used directly by iOS and not at all by other platforms. They separate
# the different mocks so we can use them in different iOS bundles
filegroup(
    name = "asset_mocks",
    srcs = ["//plugins/reference-assets/mocks:mocks_json",],
    visibility = ["//visibility:public"],
)
filegroup(
    name = "plugin_mocks",
    srcs = ["//plugins/{}/mocks".format(plugin) for plugin in PLUGIN_MOCKS],
    visibility = ["//visibility:public"],
)
filegroup(
    name = "a2ui_mocks",
    srcs = ["//plugins/a2ui/mocks:snapshots"],
    visibility = ["//visibility:public"],
)
# ---- END iOS ---- #

# NOTE: A2UI mocks are intentionally NOT included here. This manifest feeds
# `//tools/mocks:jar`, which Player-flow tooling (the demo's mock browser,
# reference-asset instrumented tests) reads and runs through `makeFlow`. A2UI
# snapshots (`{ surfaceId, components }`) are not Player `Flow`s — `makeFlow`
# throws on them ("No clue how to convert this into a flow"). The canonical A2UI
# snapshots live at `//plugins/a2ui/mocks:snapshots` for JS consumers
# (`@player-ui/a2ui-plugin-mocks`); native A2UI tests inline the snapshots and
# start them with the `"a2ui"` format.

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
        "package.json",
        "//plugins/a2ui/mocks:snapshots"
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
