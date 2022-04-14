load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/metrics-plugin",
    dependencies = [
        "@npm//tapable",
        "@npm//@types/tapable",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
        "//plugins/beacon/core:@player-ui/beacon-plugin",
    ],
    library_name = "MetricsPlugin"
)
