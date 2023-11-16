load("//:index.bzl", "generate_manifest")
load("//:index.bzl", "javascript_pipeline")

filegroup(
    name = "mocks",
    srcs = glob(["**/*.json"]),
    visibility = ["//visibility:public"],
)

generate_manifest(
    name = "manifest",
    mocks = [":mocks"],
    visibility = ["//visibility:public"],
)

javascript_pipeline(
    name = "@player-ui/pubsub-plugin-mocks",
    entry = "index.ts",
    dependencies = [
        "@npm//@player-tools/dsl",
    ],
    other_srcs = [
        "index.ts",
        ":manifest",
    ] + glob(["**/*.tsx"]),
    out_dir = "",
)

java_library(
    name = "jar",
    resources = [":mocks"],
    resource_strip_prefix = "plugins/pubsub/mocks/",
    visibility = ["//visibility:public"],
)