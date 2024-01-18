load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_player//kotlin:lint.bzl", "lint")
load(":deps.bzl", "main_deps", "main_exports")

kt_android_library(
    name = "assets",
    srcs = glob(["src/main/java/**/*.kt"]),
    custom_package = "com.intuit.player.android.reference.assets",
    enable_data_binding = False,
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    visibility = ["//visibility:public"],
    exports = main_exports,
    deps = main_deps,
)

lint(
    name = "assets",
    srcs = glob(["src/main/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)
