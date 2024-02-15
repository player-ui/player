load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_player//kotlin:lint.bzl", "lint")
load(":deps.bzl", "main_deps")

kt_android_library(
    name = "test",
    srcs = [
        "Assertions.kt",
        "AssetTest.kt",
    ],
    visibility = ["//plugins/reference-assets/android:__subpackages__"],
    deps = main_deps,
)

lint(
    name = "test",
    srcs = glob(["*.kt"]),
    lint_config = "//jvm:lint_config",
)
