load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/react-utils",
    entry = "src/index.tsx",
    peer_dependencies = [
        "@npm//@types/react",
        "@npm//react",
        "//core/player:@player-ui/player",
    ],
)
