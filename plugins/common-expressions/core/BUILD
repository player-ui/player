load("@rules_player//player:defs.bzl", "js_xlr_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "NATIVE_BUILD_DEPS", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_xlr_pipeline(
    package_name = "@player-ui/common-expressions-plugin",
    build_deps = NATIVE_BUILD_DEPS,
    native_bundle = "CommonExpressionsPlugin",
    peer_deps = [
        ":node_modules/@player-ui/player",
    ],
    test_deps = [
        ":node_modules/@player-ui/make-flow",
        "//:vitest_config",
    ],
    deps = [
        ":node_modules/@player-ui/expression-plugin",
    ],
)
