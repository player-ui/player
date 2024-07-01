load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")
load("@rules_player//javascript:defs.bzl", "js_pipeline")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/reference-assets-cli-preset",
    peer_deps = [
        "//:node_modules/@player-tools/cli",
    ],
    deps = [
        ":node_modules/@player-ui/reference-assets-plugin",
        ":node_modules/@player-ui/types",
    ],
)
