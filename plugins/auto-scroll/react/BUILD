load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/auto-scroll-manager-plugin-react",
    dependencies = [
        "@npm//smooth-scroll-into-view-if-needed",
    ],
    peer_dependencies = [
        "//react/player:@player-ui/react",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow",
        "//plugins/reference-assets/react:@player-ui/reference-assets-plugin-react",
        "//plugins/common-types/core:@player-ui/common-types-plugin",
        "//plugins/asset-transform/core:@player-ui/asset-transform-plugin"
    ]
)
