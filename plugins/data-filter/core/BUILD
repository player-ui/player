load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/data-filter-plugin",
    dependencies = [
        "@npm//timm",
        "@npm//dlv",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow",
    ]
)
