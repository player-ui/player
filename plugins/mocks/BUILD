load("//:index.bzl", "generate_manifest")
load("//:index.bzl", "javascript_pipeline")

generate_manifest(
    name = "mocks",
    mocks = ["//plugins/reference-assets/mocks","//plugins/pubsub/mocks", "//plugins/external-action/mocks"],
    visibility = ["//visibility:public"],
)

java_library(
    name = "jar",
    resources = [":mocks"],
    resource_strip_prefix = "plugins/",
    visibility = ["//visibility:public"],
)


