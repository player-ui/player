load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("//tools:defs.bzl", "NATIVE_BUILD_DEPS", "tsup_config", "vitest_config")

NATIVE_BUNDLE = "Registry"

tsup_config(
    name = "tsup_config",
    native_bundle = NATIVE_BUNDLE,
)

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/partial-match-registry",
    build_deps = NATIVE_BUILD_DEPS,
    native_bundle = NATIVE_BUNDLE,
    deps = [
        "//:node_modules/@types/dlv",
        "//:node_modules/dlv",
        "//:node_modules/sorted-array",
    ],
)
