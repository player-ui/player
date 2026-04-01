load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_pipeline(
    name = "subscribe",
    package_name = "@player-ui/react-subscribe",
    peer_deps = [
        "//:node_modules/@types/react",
        "//:node_modules/@types/use-sync-external-store",
        "//:node_modules/react",
    ],
    deps = [
        "//:node_modules/p-defer",
        "//:node_modules/use-sync-external-store",
    ],

)
