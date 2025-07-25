load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "NATIVE_BUILD_DEPS", "tsup_config", "vitest_config")

NATIVE_BUNDLE = "MakeFlow"

npm_link_all_packages(name = "node_modules")

tsup_config(
    name = "tsup_config",
    native_bundle = NATIVE_BUNDLE,
)

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/make-flow",
    build_deps = NATIVE_BUILD_DEPS,
    native_bundle = NATIVE_BUNDLE,
    deps = [
        ":node_modules/@player-ui/types",
    ],
)
