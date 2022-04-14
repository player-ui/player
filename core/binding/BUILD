load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/binding",
    dependencies = [
        "//core/binding-grammar:@player-ui/binding-grammar",
        "@npm//tapable",
        "@npm//@types/tapable",
        "@npm//nested-error-stacks",
        "@npm//@types/nested-error-stacks"
    ],
    test_data = [
        "@npm//dlv",
        "@npm//arr-flatten",
    ]
)
