load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/pubsub-plugin",
    dependencies = [
        "@npm//tapable-ts",
        "@npm//pubsub-js",
        "@npm//@types/pubsub-js",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    library_name = "PubSubPlugin"
)
