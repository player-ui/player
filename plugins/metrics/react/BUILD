load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/metrics-plugin-react",
    dependencies = [
        "//plugins/metrics/core:@player-ui/metrics-plugin",
    ],
    peer_dependencies = [
        "@npm//react",
        "//core/player:@player-ui/player",
        "//react/player:@player-ui/react",
    ],
)
