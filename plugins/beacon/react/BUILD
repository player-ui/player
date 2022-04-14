load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/beacon-plugin-react",
    dependencies = [
        "//plugins/beacon/core:@player-ui/beacon-plugin",
        "//react/utils:@player-ui/react-utils",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
        "//react/player:@player-ui/react",
    ],
)
