load("@rules_java//java:java_library.bzl", "java_library")
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
    srcs = glob(["**/*.json"]),
    visibility = ["//visibility:public"],
)

# The canonical component snapshots, exactly `<group>/<name>.json` (excludes the
# top-level package.json and the node_modules package boundary).
filegroup(
    name = "catalog",
    srcs = glob(["*/*.json"]),
    visibility = ["//visibility:public"],
)

# A2UI-specific mock manifest, published to a DISTINCT classpath path
# (`a2ui/mocks/manifest.json`) so it never collides with the shared Player-flow
# manifest at `mocks/manifest.json`. A2UI snapshots are not Player `Flow`s, so
# they must stay out of anything that runs content through `makeFlow`.
genrule(
    name = "a2ui_mocks_manifest",
    srcs = [":catalog"],
    outs = ["manifest.json"],
    cmd = """
    {
      printf '['
      sep=''
      for f in $(SRCS); do
        rel=$${f##*/mocks/}
        grp=$${rel%%/*}
        nm=$${rel#*/}
        nm=$${nm%.json}
        printf '%s{"group":"%s","name":"%s","path":"a2ui/mocks/%s"}' "$$sep" "$$grp" "$$nm" "$$rel"
        sep=','
      done
      printf ']'
    } > $@
    """,
)

# Bundles the manifest + raw snapshots on the JVM/Android classpath under
# `a2ui/mocks/**` (strip `plugins` from `plugins/a2ui/mocks/**`). Consume with
# `ClassLoaderMocksReader(classLoader, "a2ui/mocks/manifest.json")` and start
# each entry with the `"a2ui"` content format.
java_library(
    name = "jar",
    resource_strip_prefix = "plugins",
    resources = [":a2ui_mocks_manifest"] + glob(["*/*.json"]),
    visibility = ["//visibility:public"],
)
