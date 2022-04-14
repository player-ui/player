load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/types-provider-plugin",
    dependencies = [
        "@npm//tapable",
        "@npm//@types/tapable",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow",
        "//plugins/asset-transform/core:@player-ui/asset-transform-plugin",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    library_name = "TypesProviderPlugin"
)
