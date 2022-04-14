load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/common-expressions-plugin",
    dependencies = [
        "//core/utils:@player-ui/utils",
        "//plugins/expression/core:@player-ui/expression-plugin",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow"
    ],
    library_name = 'CommonExpressionsPlugin'
)
