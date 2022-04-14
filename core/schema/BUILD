load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/schema",
    dependencies = [
        "//core/binding:@player-ui/binding",
        "//core/data:@player-ui/data",
        "//core/types:@player-ui/types",
        "//core/validator:@player-ui/validator",
        "@npm//tapable",
    ],
    test_data = [
        "//core/expressions:@player-ui/expressions",
    ],
)
