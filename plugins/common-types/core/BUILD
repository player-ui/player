load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/common-types-plugin",
    dependencies = [
        "//core/utils:@player-ui/utils",
        "//core/constants:@player-ui/constants",
        "//core/string-resolver:@player-ui/string-resolver",
        "//plugins/types-provider/core:@player-ui/types-provider-plugin",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow",
        "//plugins/asset-transform/core:@player-ui/asset-transform-plugin",
    ],
    peer_dependencies = [
        "//core/player:@player-ui/player",
    ],
    library_name = 'CommonTypesPlugin'
)
