load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@io_bazel_rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//android/player:deps.bzl", "test_deps")

kt_android_library(
    name = "android_test_utils",
    srcs = [
        "Json.kt",
        "BrokenAsset.kt",
        "NestedAsset.kt",
        "OtherSimpleAsset.kt",
        "SimpleAsset.kt",
        "TestAssetsPlugin.kt",
        "Updates.kt"
    ],
    custom_package = "com.intuit.playerui.android.utils",
    manifest = "//android/player:manifest",
    associates = ["//android/player:constants"],
    deps = ["//android/player:player"] + test_deps,
    visibility = ["//visibility:public"]
)

kt_jvm_library(
    name = "android_log_util",
    srcs = ["LogUtil.kt"],
    deps = ["//android/player/src/test/java/android/util:android_utils_stub"],
    visibility = ["//visibility:public"]
)
