load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/expression-plugin",
    dependencies = [
        "@npm//tapable",
        "@npm//@types/tapable",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    library_name = 'ExpressionPlugin'
)
