load(":deps.bzl", "main_deps", "main_exports", "main_resources", "test_deps")
load("@build_constants//:constants.bzl", "VERSION")
load("@rules_kotlin//kotlin:core.bzl", "kt_kotlinc_options")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//jvm:defs.bzl", "distribution")
load("@rules_player//kotlin:defs.bzl", "kt_jvm_junit5_test", "lint")

java_import(
    name = "android_sdk",
    jars = ["@bazel_tools//tools/android:android_jar"],
    neverlink = 1,
    visibility = ["//visibility:public"],
)

android_library(
    name = "player_base",
    visibility = ["//visibility:private"],
    exports = main_deps + [":android_sdk"],
    resource_files = glob(["src/main/res/**"]),
    manifest = ":src/main/AndroidManifest.xml",
    deps = [],
)

kt_jvm_library(
    name = "player_kt",
    srcs = glob(["src/main/java/**/*.kt"]),
    resources = main_resources,
    exports = main_exports,
    deps = main_deps + [
        ":android_sdk",
        ":player_base"
    ]
)

android_library(
    name = "player",
    custom_package = "com.intuit.playerui.android",
    resource_files = glob(["src/main/res/**"]),
    manifest = ":src/main/AndroidManifest.xml",
    tags = ["maven_coordinates=com.intuit.playerui:android:aar:%s" % VERSION],
    deps = main_deps,
    exports = main_exports + [":player_kt"],
    visibility = ["//visibility:public"],
)

distribution(
    name = "player",
    lib_name = "player",
    maven_coordinates = "com.intuit.playerui:android:%s" % VERSION,
)

kt_jvm_junit5_test(
    name = "player-tests",
    srcs = glob(["src/test/java/**"]),
    associates = [":player_kt"],
    kotlinc_opts = "//jvm:test_options",
    test_package = "com.intuit.playerui.android",
    deps = [":player"] + test_deps,
)

lint(
    name = "player",
    srcs = glob(["src/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)
