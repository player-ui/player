load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")
load("@rules_player//player:defs.bzl", "xlr_compile")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

xlr_compile(
    name = "assets_xlr",
    srcs = glob(["src/**"]),
    data = [
        # TODO: Fix for missing dlv in @player-ui
        "//:node_modules/dlv",
    ],
    env = {
        "DEBUG": "player:*",
    },
)

js_pipeline(
    package_name = "@player-ui/reference-assets-plugin",
    include_packaging_targets = [
        ":assets_xlr",
    ],
    native_bundle = "ReferenceAssetsPlugin",
    peer_deps = [
        ":node_modules/@player-ui/player",
    ],
    test_deps = [
        ":node_modules/@player-ui/asset-testing-library",
        "//:vitest_config",
    ],
    deps = [
        ":node_modules/@player-ui/asset-transform-plugin",
        ":node_modules/@player-ui/beacon-plugin",
    ],
)
