load("//plugins:defs.bzl", "GROUP", "kt_player_plugin_wrapper")

kt_player_plugin_wrapper(
    name = "common-types",
    package = GROUP + ".types",
    plugin_name = "CommonTypesPlugin",
    plugin_source = "plugins/common-types/core/dist/CommonTypesPlugin.native.js",
    resources = ["//plugins/common-types/core:core_native_bundle"],
)
