load("//:index.bzl", "generate_manifest")
load("//:index.bzl", "javascript_pipeline")

# filegroup is used to create a larger manifest
filegroup(
    name = "mock",
    srcs = glob(["**/*.json"]),
    visibility = ["//visibility:public"],
)

# change load to :build.bzl to use generate manifest for non filegorup
generate_manifest(
    name = "manifest",
    mocks = [":mock"],
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

#need to figure out how to consolidate jars remove resource strip
#  resource_strip_prefix = "plugins/reference-assets/mocks", adding this works with filegroups
java_library(
    name = "jar",
    resources = [":mock"],
    resource_strip_prefix = "plugins/pubsub/mocks/",
    visibility = ["//visibility:public"],
)