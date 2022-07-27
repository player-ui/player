load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/beacon-plugin-react",
    dependencies = [
        "//plugins/beacon/core:@player-ui/beacon-plugin",
        "//react/utils:@player-ui/react-utils",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow"
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
        "//react/player:@player-ui/react",
    ],
)
