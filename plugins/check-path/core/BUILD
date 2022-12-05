load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/check-path-plugin",
    dependencies = [
        "//core/partial-match-registry:@player-ui/partial-match-registry",
        "//plugins/check-path/core-rs:@player-ui/check-path-plugin-rs",
        "@npm//dlv",
        "@npm//tapable-ts",
    ],
    library_name = "CheckPathPlugin",
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow",
        "//plugins/asset-transform/core:@player-ui/asset-transform-plugin",
    ],
)
