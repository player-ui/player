load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_library")
load(":deps.bzl", "main_deps", "main_exports")

kt_android_library(
    name = "assets",
    srcs = glob(["src/main/java/**/*.kt"]),
    custom_package = "com.intuit.player.android.reference.assets",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    deps = main_deps,
    exports = main_exports,
    visibility = ["//visibility:public"],
)
