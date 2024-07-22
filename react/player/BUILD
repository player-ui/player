load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_pipeline(
    name = "player",
    package_name = "@player-ui/react",
    peer_deps = [
        "//:node_modules/@types/react",
        "//:node_modules/react",
        "//:node_modules/react-dom",
    ],
    test_deps = [
        ":node_modules/@player-ui/make-flow",
        "//:vitest_config",
    ],
    deps = [
        ":node_modules/@player-ui/metrics-plugin",
        ":node_modules/@player-ui/partial-match-registry",
        ":node_modules/@player-ui/player",
        ":node_modules/@player-ui/react-subscribe",
        "//:node_modules/react-error-boundary",
        "//:node_modules/tapable-ts",
        "//:node_modules/string-similarity",
        "//:node_modules/@types/string-similarity",
    ],
)
