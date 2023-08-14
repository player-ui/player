load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/stage-revert-data-plugin",
    dependencies = [
        "@npm//tapable-ts",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow",
        "//core/types:@player-ui/types",

    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    library_name = "StageRevertDataPlugin"
)
