load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/react",
    entry = "src/index.tsx",
    dependencies = [
        "//core/player:@player-ui/player",
        "//core/partial-match-registry:@player-ui/partial-match-registry",
        "//plugins/metrics/core:@player-ui/metrics-plugin",
        "//react/subscribe:@player-ui/react-subscribe",
        "@npm//react-error-boundary",
        "@npm//tapable-ts"
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow",
        "@npm//@testing-library/react",
        "@npm//@testing-library/react-hooks",
    ],
    peer_dependencies = [
        "@npm//@types/react",
        "@npm//react",
        "@npm//react-dom",
    ],
)
