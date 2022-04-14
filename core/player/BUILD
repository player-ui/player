load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/player",
    dependencies = [
        "//core/binding:@player-ui/binding",
        "//core/constants:@player-ui/constants",
        "//core/data:@player-ui/data",
        "//core/expressions:@player-ui/expressions",
        "//core/flow:@player-ui/flow",
        "//core/logger:@player-ui/logger",
        "//core/partial-match-registry:@player-ui/partial-match-registry",
        "//core/schema:@player-ui/schema",
        "//core/string-resolver:@player-ui/string-resolver",
        "//core/types:@player-ui/types",
        "//core/utils:@player-ui/utils",
        "//core/validator:@player-ui/validator",
        "//core/view:@player-ui/view",
        "@npm//babel-plugin-preval",
        "@npm//dequal",
        "@npm//p-defer",
        "@npm//queue-microtask",
        "@npm//tapable",
        "@npm//timm",
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow",
    ],
    library_name = "Player"
)
