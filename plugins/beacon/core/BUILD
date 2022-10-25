load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/beacon-plugin",
    dependencies = [
        "@npm//tapable-ts",
        "@npm//timm",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
        "//core/types:@player-ui/types",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow"
    ],
    library_name = "BeaconPlugin"
)
