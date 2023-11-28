load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/markdown-plugin",
    peer_deps = [
        ":node_modules/@player-ui/player",
        ":node_modules/@player-ui/types",
    ],
    test_deps = [
        ":node_modules/@player-ui/partial-match-fingerprint-plugin",
        ":node_modules/@player-ui/partial-match-registry",
        "//:vitest_config",
    ],
    deps = [
        "//:node_modules/mdast-util-from-markdown",
        "//:node_modules/tapable-ts",
    ],
)
