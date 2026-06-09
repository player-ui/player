load("@bazel_skylib//rules:copy_file.bzl", "copy_file")
load("@rules_player//javascript:defs.bzl", "js_pipeline")
load("@rules_player//player:defs.bzl", "generate_mocks_manifest")
load("@npm//:defs.bzl", "npm_link_all_packages")
load("//tools:defs.bzl", "tsup_config", "vitest_config")

npm_link_all_packages(name = "node_modules")

tsup_config(name = "tsup_config")

vitest_config(name = "vitest_config")

# Raw snapshot JSONs — the canonical source. Exposed for cross-platform
# consumers (iOS / Android).
# Named `snapshots` (not `mocks`) because `js_pipeline` below auto-creates an
# `npm_package` target named `mocks` from the bazel package directory name.
filegroup(
    name = "snapshots",
    srcs = glob(["src/**/*.json"]),
    visibility = ["//visibility:public"],
)

# Re-root the snapshots under `mocks/<group>/<file>.json`. The //tools/mocks
# manifest generator derives each mock's classpath path from the last three
# path segments, so the directory immediately above `<group>` must be `mocks`
# (matching the compiled reference-asset mocks). Leaving them under `src/`
# produces `./src/...` manifest paths that fail to resolve at runtime.
_snapshots = glob(["src/**/*.json"])

[
    copy_file(
        name = "rerooted_{}".format(f.removeprefix("src/").replace("/", "_").replace(".json", "")),
        src = f,
        out = "mocks/{}".format(f.removeprefix("src/")),
    )
    for f in _snapshots
]

filegroup(
    name = "rerooted_mocks",
    srcs = [
        ":rerooted_{}".format(f.removeprefix("src/").replace("/", "_").replace(".json", ""))
        for f in _snapshots
    ],
    visibility = ["//visibility:public"],
)
