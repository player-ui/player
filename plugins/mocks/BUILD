load("//:index.bzl", "generate_manifest")
load("//:index.bzl", "javascript_pipeline")

# testing this build file
# pubsub/mocks:mock calls a filegroup
# generate manifest from //:index.bzl calls with filegroups
generate_manifest(
    name = "mocks",
    mocks = ["//plugins/reference-assets/mocks:mock"],
    visibility = ["//visibility:public"],
)

java_library(
    name = "jar",
    resources = [":mocks"],
    resource_strip_prefix = "plugins/",
    visibility = ["//visibility:public"],
)


