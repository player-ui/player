load("//android/player:deps.bzl", "test_deps")
load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@io_bazel_rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")

kt_android_library(
    name = "android_utils",
    srcs = glob(["java/com/intuit/player/android/utils/*.kt", "java/android/**/*.kt"]),
    custom_package = "com.intuit.player.android.utils",
    manifest = "//android/player:src/main/AndroidManifest.xml",
    deps = ["//android/player:player"] + test_deps,
    visibility = ["//visibility:public"]
)

