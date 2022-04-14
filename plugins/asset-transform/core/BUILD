load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/asset-transform-plugin",
    dependencies = [
        "//core/partial-match-registry:@player-ui/partial-match-registry",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
        "//core/types:@player-ui/types",
        "//core/view:@player-ui/view",
    ],
)
