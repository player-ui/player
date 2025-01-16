load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "NATIVE_BUILD_DEPS", "tsup_config", "vitest_config")
load("@rules_player//player:defs.bzl", "js_xlr_pipeline")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_xlr_pipeline(
    package_name = "@player-ui/reference-assets-plugin",
    build_deps = NATIVE_BUILD_DEPS,
    native_bundle = "ReferenceAssetsPlugin",
    peer_deps = [
        ":node_modules/@player-ui/player",
    ],
    test_deps = [
        ":node_modules/@player-ui/asset-testing-library",
        ":node_modules/@player-ui/common-types-plugin",
        "//:vitest_config",
        ":node_modules/@player-ui/async-node-plugin",
    ],
    deps = [
        ":node_modules/@player-ui/asset-transform-plugin",
        ":node_modules/@player-ui/beacon-plugin",
        "//:node_modules/uuid",
        "//:node_modules/@types/uuid",
    ],
)
