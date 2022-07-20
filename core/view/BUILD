load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/view",
    dependencies = [
        "//core/binding:@player-ui/binding",
        "//core/constants:@player-ui/constants",
        "//core/data:@player-ui/data",
        "//core/expressions:@player-ui/expressions",
        "//core/flow:@player-ui/flow",
        "//core/types:@player-ui/types",
        "//core/schema:@player-ui/schema",
        "//core/logger:@player-ui/logger",
        "//core/string-resolver:@player-ui/string-resolver",
        "//core/validator:@player-ui/validator",
        "@npm//tapable-ts",
        "@npm//timm",
        "@npm//dlv",
        "@npm//dequal",
    ],
)
