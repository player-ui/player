load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/reference-assets-plugin",
    dependencies = [
        "//plugins/beacon/core:@player-ui/beacon-plugin",
        "//plugins/asset-transform/core:@player-ui/asset-transform-plugin",
    ],
    test_data = [
        "//tools/asset-testing-library/core:@player-ui/asset-testing-library"
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    library_name = "ReferenceAssetsPlugin",
    xlr_mode = "plugin"
)
