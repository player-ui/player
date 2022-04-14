load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/react-asset",
    entry = "src/index.tsx",
    test_data = [
        "@npm//@testing-library/react",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
        "//core/partial-match-registry:@player-ui/partial-match-registry",
        "@npm//@types/react",
        "@npm//react",
    ],
)
