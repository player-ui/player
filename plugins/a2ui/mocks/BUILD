load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@rules_player//player:defs.bzl", "generate_mocks_manifest")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

# Raw snapshot JSONs — the canonical source. Exposed for cross-platform
# consumers (iOS / Android) and for the top-level //tools/mocks aggregator.
# Named `snapshots` (not `mocks`) because `js_pipeline` below auto-creates an
# `npm_package` target named `mocks` from the bazel package directory name.
filegroup(
    name = "snapshots",
    srcs = glob(["src/**/*.json"]),
    visibility = ["//visibility:public"],
)
