load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/devtools-plugin-react",
    dependencies = [
        "//plugins/devtools/core:@player-ui/devtools-plugin",
        "@npm//@player-tools/devtools-common",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
        "//react/player:@player-ui/react",
    ],
    test_data = [],
)

alias(
    name = "react",
    actual = ":@player-ui/devtools-plugin-react",
)
