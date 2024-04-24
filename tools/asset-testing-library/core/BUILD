load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/asset-testing-library",
    deps = [
        ":node_modules/@player-ui/asset-transform-plugin",
        ":node_modules/@player-ui/make-flow",
        ":node_modules/@player-ui/player",
    ],
)
