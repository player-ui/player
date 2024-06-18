load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_player//kotlin:lint.bzl", "lint")
load(":deps.bzl", "main_deps", "main_exports")

exports_files([
    "src/main/AndroidManifest.xml"
])

kt_android_library(
    name = "assets",
    srcs = glob(["src/main/java/**/*.kt"]),
    custom_package = "com.intuit.playerui.android.reference.assets",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    visibility = ["//visibility:public"],
    plugins = ["//android/player:jetpack_compose_compiler_plugin"],
    exports = main_exports,
    deps = main_deps,
)

lint(
    name = "assets",
    srcs = glob(["src/main/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)
