load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/react",
    entry = "src/index.tsx",
    dependencies = [
        "//core/player:@player-ui/player",
        "//core/partial-match-registry:@player-ui/partial-match-registry",
        "//plugins/metrics/core:@player-ui/metrics-plugin",
        "//react/asset:@player-ui/react-asset",
        "//react/subscribe:@player-ui/react-subscribe",
        "//react/utils:@player-ui/react-utils",
        "@npm//react-error-boundary",
        "@npm//tapable",
        "@npm//@types/tapable",
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
