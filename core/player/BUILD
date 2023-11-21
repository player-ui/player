load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")

npm_link_all_packages(name = "node_modules")

js_pipeline(
    package_name = "@player-ui/player",
    test_deps = [
        "//:vitest_config",
        ":node_modules/@player-ui/make-flow",
        # ":node_modules/@player-ui/common-types-plugin",
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
