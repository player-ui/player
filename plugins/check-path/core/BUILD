load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "NATIVE_BUILD_DEPS", "tsup_config", "vitest_config")

NATIVE_BUNDLE = "CheckPathPlugin"

npm_link_all_packages(name = "node_modules")

tsup_config(
    name = "tsup_config",
    native_bundle = NATIVE_BUNDLE,
)

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/check-path-plugin",
    build_deps = NATIVE_BUILD_DEPS,
    native_bundle = NATIVE_BUNDLE,
    peer_deps = [
        ":node_modules/@player-ui/player",
    ],
    test_deps = [
        ":node_modules/@player-ui/asset-transform-plugin",
        ":node_modules/@player-ui/make-flow",
        "//:vitest_config",
    ],
    deps = [
        ":node_modules/@player-ui/partial-match-registry",
        "//:node_modules/@types/dlv",
        "//:node_modules/dlv",
        "//:node_modules/tapable-ts",
    ],
)
