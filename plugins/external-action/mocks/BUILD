load(":build.bzl", "generate_manifest")
load("//:index.bzl", "javascript_pipeline")

generate_manifest(
    name = "mocks",
    mocks = glob(["*/*.json"]),
    visibility = ["//visibility:public"],
)

javascript_pipeline(
    name = "@player-ui/external-action-plugin-mocks",
    entry = "index.ts",
    other_srcs = [
        "index.ts",
        ":mocks",
    ],
    out_dir = "",
)

java_library(
    name = "jar",
    resources = [":mocks"],
    resource_strip_prefix = "plugins/external-action/mocks",
    visibility = ["//visibility:public"],
)
