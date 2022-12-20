load("//:index.bzl", "javascript_pipeline")

javascript_pipeline(
    name = "@player-ui/player",
    dependencies = [
        "//core/partial-match-registry:@player-ui/partial-match-registry",
        "//core/types:@player-ui/types",
        "@npm//dequal",
        "@npm//p-defer",
        "@npm//queue-microtask",
        "@npm//tapable-ts",
        "@npm//nested-error-stacks",
        "@npm//@types/nested-error-stacks",
        "@npm//parsimmon",
        "@npm//@types/parsimmon",
        "@npm//arr-flatten",
        "@npm//ebnf",
        "@npm//timm",
        "@npm//error-polyfill"
    ],
    test_data = [
        "//core/make-flow:@player-ui/make-flow",
    ],
    library_name = "Player",
    bundle_entry = 'bundle.entry.js'
)
