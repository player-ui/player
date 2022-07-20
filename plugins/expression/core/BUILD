load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/expression-plugin",
    dependencies = [
        "@npm//tapable-ts",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    library_name = 'ExpressionPlugin'
)
