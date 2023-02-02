load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/reference-assets-components",
    dependencies = [
      "//plugins/reference-assets/core:@player-ui/reference-assets-plugin"
    ],

    peer_dependencies = [
        "@npm//react",
        "@npm//@types/react",
        "@npm//@player-tools/dsl"
    ]
)
