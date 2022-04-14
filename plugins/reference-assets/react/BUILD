load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/reference-assets-plugin-react",
    dependencies = [
        "//plugins/reference-assets/core:@player-ui/reference-assets-plugin",
        "//core/partial-match-registry:@player-ui/partial-match-registry",
        "//plugins/asset-provider/react:@player-ui/asset-provider-plugin-react",
        "//plugins/beacon/react:@player-ui/beacon-plugin-react",
        "@npm//clsx",
        "@npm//@chakra-ui/react",
        "@npm//@chakra-ui/icons"
    ],
    peer_dependencies = [
        "@npm//@types/node",
        "//react/player:@player-ui/react",
    ],
    test_data = [
        "@npm//@testing-library/react",
        "//core/make-flow:@player-ui/make-flow",
    ],
)

filegroup(
    name = "stories",
    srcs = glob(["src/**/*.stories.tsx"])
)