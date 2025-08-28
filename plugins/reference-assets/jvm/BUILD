load("//plugins:defs.bzl", "kt_player_plugin_wrapper", "GROUP")

kt_player_plugin_wrapper(
    name = "reference-assets",
    package = GROUP + ".assets",
    plugin_name = "ReferenceAssetsPlugin",
    plugin_source = "plugins/reference-assets/core/dist/ReferenceAssetsPlugin.native.js",
    resources = ["//plugins/reference-assets/core:core_native_bundle"],
)
