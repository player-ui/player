load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/computed-properties-plugin",
    dependencies = [
        "@npm//tapable-ts",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow",
        "//plugins/common-expressions/core:@player-ui/common-expressions-plugin",
        "//plugins/common-types/core:@player-ui/common-types-plugin",
        "//plugins/asset-transform/core:@player-ui/asset-transform-plugin",
        "//core/make-flow:@player-ui/make-flow",
        "//core/partial-match-registry:@player-ui/partial-match-registry"
    ]
)
