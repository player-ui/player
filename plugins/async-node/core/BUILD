load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/async-node-plugin",
    dependencies = [
        "@npm//tapable-ts",
        "@npm//queue-microtask",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player"
    ],
    library_name = "AsyncNodePlugin"
)
