load("@rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_player//kotlin:defs.bzl", "lint")
load(":deps.bzl", "main_deps", "main_exports")

kt_android_library(
    name = "assets",
    srcs = glob(["src/main/java/**/*.kt"]),
    custom_package = "com.intuit.playerui.android.reference.assets",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    deps = main_deps,
    exports = main_exports,
    plugins = ["//android/player:jetpack_compose_compiler_plugin"],
    visibility = ["//visibility:public"],
)

lint(
    name = "assets",
    srcs = glob(["src/main/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)
