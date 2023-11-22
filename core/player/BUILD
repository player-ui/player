load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/player",
    test_deps = [
        ":node_modules/@player-ui/common-types-plugin",
        ":node_modules/@player-ui/make-flow",
        "//:vitest_config",
    ],
    deps = [
        ":node_modules/@player-ui/partial-match-registry",
        ":node_modules/@player-ui/types",
        "//:node_modules/@types/parsimmon",
        "//:node_modules/arr-flatten",
        "//:node_modules/dequal",
        "//:node_modules/dlv",
        "//:node_modules/ebnf",
        "//:node_modules/error-polyfill",
        "//:node_modules/p-defer",
        "//:node_modules/parsimmon",
        "//:node_modules/queue-microtask",
        "//:node_modules/tapable-ts",
        "//:node_modules/timm",
        "//:node_modules/ts-nested-error",
    ],
)
