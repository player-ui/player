load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_library")
load(":deps.bzl", "main_deps")

kt_android_library(
  name = "test",
  srcs = ["assertions.kt", "AssetTest.kt"],
  deps = main_deps,
  visibility = ["//plugins/reference-assets/android:__subpackages__"],
)
