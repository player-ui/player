load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/auto-scroll-manager-plugin-react",
    peer_deps = [
        ":node_modules/@player-ui/react",
        "//:node_modules/react",
        "//:node_modules/@types/react",
    ],
    test_deps = [
        ":node_modules/@player-ui/asset-transform-plugin",
        ":node_modules/@player-ui/common-types-plugin",
        ":node_modules/@player-ui/make-flow",
        ":node_modules/@player-ui/reference-assets-plugin",
        ":node_modules/@player-ui/reference-assets-plugin-react",
        "//:vitest_config",
    ],
    deps = [
        "//:node_modules/seamless-scroll-polyfill",
    ],
)
