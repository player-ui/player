load("@rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_player//kotlin:defs.bzl", "lint")
load(":deps.bzl", "main_deps")

kt_android_library(
    name = "testutils",
    srcs = glob(["src/main/**/*.kt"]),
    visibility = ["//visibility:public"],
    deps = main_deps,
)

lint(
    name = "testutils",
    srcs = glob(["src/main/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)