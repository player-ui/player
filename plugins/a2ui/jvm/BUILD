load("//plugins:defs.bzl", "GROUP", "kt_player_plugin_wrapper")

kt_player_plugin_wrapper(
    name = "a2ui",
    package = GROUP + ".a2ui",
    plugin_name = "A2UIPlugin",
    plugin_source = "plugins/a2ui/core/dist/A2UIPlugin.native.js",
    resources = ["//plugins/a2ui/core:core_native_bundle"],
)
