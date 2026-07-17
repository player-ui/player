load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/a2ui",
    srcs = glob(["src/**/*"]),
    build_deps = [
        "//:tsup_config",
        "//:typings",
    ],
    peer_deps = [
        ":node_modules/@player-ui/react",
        ":node_modules/@player-ui/player",
        "//:node_modules/react",
        "//:node_modules/@types/react",
    ],
    test_deps = [
        "//:node_modules/@testing-library/react",
        "//:vitest_config",
    ],
    deps = [
        ":node_modules/@player-ui/a2ui-plugin",
        ":node_modules/@player-ui/a2ui-plugin-react",
    ],
)
