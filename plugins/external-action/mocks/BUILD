load("//:index.bzl", "generate_manifest")
load("//:index.bzl", "javascript_pipeline")

filegroup(
    name = "mocks",
    srcs = glob(["**/*.json"]),
    visibility = ["//visibility:public"],
)

generate_manifest(
    name = "manifst",
    mocks = [":mocks"],
    visibility = ["//visibility:public"],
)

javascript_pipeline(
    name = "@player-ui/external-action-plugin-mocks",
    entry = "index.ts",
    other_srcs = [
        "index.ts",
        ":manifest",
    ],
    out_dir = "",
)

java_library(
    name = "jar",
    resources = [":mocks"],
    resource_strip_prefix = "plugins/external-action/mocks",
    visibility = ["//visibility:public"],
)
