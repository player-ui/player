load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/check-path-plugin-react",
    dependencies = [
        "//plugins/check-path/core:@player-ui/check-path-plugin",
    ],
    peer_dependencies = [
        "//react/player:@player-ui/react",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow"
    ],
)
