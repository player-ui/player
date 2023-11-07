load(":build.bzl", "generate_manifest")
load("//:index.bzl", "javascript_pipeline")

filegroup(
    name = "mock",
    srcs = glob(["**/*.json"]),
    visibility = ["//visibility:public"],
)

generate_manifest(
    name = "manifest",
    mocks = [":mock"],
    visibility = ["//visibility:public"],
)

javascript_pipeline(
    name = "@player-ui/reference-assets-plugin-mocks",
    entry = "index.ts",
     dependencies = [
        "@npm//@player-tools/dsl",
        "//plugins/reference-assets/components:@player-ui/reference-assets-components"
    ],
    other_srcs = [
        "index.ts",
        ":manifest",
    ] + glob(["**/*.tsx"]),
    out_dir = "",
)

java_library(
    name = "jar",
    resources = [":mock"],
    resource_strip_prefix = "plugins/reference-assets/mocks",
    visibility = ["//visibility:public"],
)