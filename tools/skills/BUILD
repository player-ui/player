load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

js_pipeline(
    package_name = "@player-ui/skills",
    srcs = glob(["src/**/*", "__tests__/**/*"]),
    tsconfig = "tsconfig.json",
    create_package_json_args = {"custom_entrypoints": True},
    include_packaging_targets = glob(["skills/**/*"]),
    test_deps = ["//:vitest_config"] + glob(["skills/**/*"]),
    deps = [
        ":node_modules/@clack/prompts",
        ":node_modules/commander",
    ],
)
