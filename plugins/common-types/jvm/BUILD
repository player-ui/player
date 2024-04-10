load("//plugins:defs.bzl", "kt_player_plugin_wrapper")

kt_player_plugin_wrapper(
    name = "common-types",
    package_scope = "types",
    plugin_name = "CommonTypesPlugin",
    plugin_source = "plugins/common-types/core/dist/common-types-plugin.prod.js",
    resources = "//plugins/common-types/core:core_native_bundle",
)