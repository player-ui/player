load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/metrics-plugin",
    dependencies = [
        "//plugins/beacon/core:@player-ui/beacon-plugin",
        "@npm//tapable-ts",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    library_name = "MetricsPlugin"
)
