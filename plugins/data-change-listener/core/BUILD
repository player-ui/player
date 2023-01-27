load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/data-change-listener-plugin",
    dependencies = [
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    test_data = [
        '//plugins/common-types/core:@player-ui/common-types-plugin',
        '//plugins/asset-transform/core:@player-ui/asset-transform-plugin',
        '//core/partial-match-registry:@player-ui/partial-match-registry'
    ]
)
