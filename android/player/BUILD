load(":defs.bzl", "main_deps", "main_exports", "main_resources", "test_deps")
load("@build_constants//:constants.bzl", "VERSION")
load("@rules_kotlin//kotlin:core.bzl", "kt_kotlinc_options")
load("//jvm:defs.bzl", "distribution")
load("@grab_bazel_common//tools/databinding:databinding.bzl", "kt_db_android_library")
load("@rules_android//android:rules.bzl", "android_binary", "android_library")
load("@rules_player//kotlin:defs.bzl", "kt_jvm_junit5_test", "lint")

kt_db_android_library(
    name = "player",
    srcs = glob(["src/main/java/**/*.kt"]),
    custom_package = "com.intuit.playerui.android",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    resources = main_resources,
    tags = ["maven_coordinates=com.intuit.playerui:android:aar:%s" % VERSION],
    visibility = ["//visibility:public"],
    deps = main_deps,
)

#distribution(
#    name = "player",
#    lib_name = "player-databinding",
#    maven_coordinates = "com.intuit.playerui:android:%s" % VERSION,
#)

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
