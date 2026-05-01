load("//plugins:defs.bzl", "GROUP", "kt_player_plugin_wrapper")

kt_player_plugin_wrapper(
    name = "common-expressions",
    package = GROUP + ".commonexpressions",
    plugin_name = "CommonExpressionsPlugin",
    plugin_source = "plugins/common-expressions/core/dist/CommonExpressionsPlugin.native.js",
    resources = ["//plugins/common-expressions/core:core_native_bundle"],
)
