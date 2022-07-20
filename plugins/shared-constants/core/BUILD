load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/shared-constants-plugin",
    dependencies = [
        "@npm//tapable-ts",
        "@npm//dlv",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow",
        "//plugins/common-types/core:@player-ui/common-types-plugin",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
)
