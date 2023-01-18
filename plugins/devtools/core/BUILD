load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/devtools-plugin",
    dependencies = [
        "@npm//@player-tools/devtools-common",
    ],
    library_name = "DevtoolsPlugin",
    peer_dependencies = [
        "//core/player:@player-ui/player",
        "//core/types:@player-ui/types",
    ],
    test_data = [],
)

alias(
    name = "core",
    actual = ":@player-ui/devtools-plugin",
    visibility = ["//devtools:__subpackages__"],
)
