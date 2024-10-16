load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")
load("@rules_player//player:defs.bzl", "js_xlr_pipeline")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_xlr_pipeline(
    package_name = "@player-ui/types",
    xlr_mode = "types",
)
