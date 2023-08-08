load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/markdown-plugin",
    dependencies = [
        "@npm//tapable-ts",
        "@npm//mdast-util-from-markdown"
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
        "//core/types:@player-ui/types",
    ],
    build_data = [
        "@npm//babel-loader",
        "@npm//@babel/plugin-transform-numeric-separator",
    ],
    test_data = [
        "//core/partial-match-registry:@player-ui/partial-match-registry",
        "//plugins/partial-match-fingerprint/core:@player-ui/partial-match-fingerprint-plugin",
    ],
    library_name = "MarkdownPlugin"
)
