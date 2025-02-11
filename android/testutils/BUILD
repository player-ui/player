load("@rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_player//kotlin:defs.bzl", "lint")
load("@build_constants//:constants.bzl", "VERSION")
load("//jvm:defs.bzl", "distribution")
load(":deps.bzl", "main_deps")

kt_android_library(
    name = "testutils_android",
    srcs = glob(["src/main/java/**/*.kt"]),
    custom_package = "com.intuit.playerui.android.testutils",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    deps = main_deps,
)

android_library(
    name = "testutils",
    custom_package = "com.intuit.playerui.android.testutils",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    tags = ["maven_coordinates=com.intuit.playerui.android:testutils:aar:%s" % VERSION],
    visibility = ["//visibility:public"],
    exports = [":testutils_android"],
    deps = main_deps,
)

distribution(
    name = "testutils",
    maven_coordinates = "com.intuit.playerui.android:testutils:%s" % VERSION,
)

lint(
    name = "testutils",
    srcs = glob(["src/main/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)