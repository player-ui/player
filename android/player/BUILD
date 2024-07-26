load(":deps.bzl", "main_deps", "main_exports", "dev_exports", "main_resources", "test_deps")
load("@build_constants//:constants.bzl", "VERSION")
load("@rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_kotlin//kotlin:core.bzl", "kt_kotlinc_options")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//jvm:defs.bzl", "distribution")
load("@rules_player//kotlin:defs.bzl", "kt_jvm_junit5_test", "lint")

kt_android_library(
    name = "player_android",
    srcs = glob(["src/main/java/**/*.kt"]),
    custom_package = "com.intuit.playerui.android",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    resources = main_resources,
    deps = main_deps,
)

config_setting(
    name = "dev",
    values = {"define": "build_type=debug"},
)

config_setting(
    name = "prod",
    values = {"define": "build_type=release"},
)

android_library(
    name = "player",
    custom_package = "com.intuit.playerui.android",
    resource_files = glob(["src/main/res/**"]),
    manifest = ":src/main/AndroidManifest.xml",
    tags = ["maven_coordinates=com.intuit.playerui:android:aar:%s" % VERSION],
    deps = main_deps + select({
        ":dev": dev_exports,
        ":prod": main_exports,
        "//conditions:default": dev_exports,
    }),
    exports = [":player_android"] + select({
        ":dev": dev_exports,
        ":prod": main_exports,
        "//conditions:default": dev_exports,
    }),
    visibility = ["//visibility:public"],
)

distribution(
    name = "player-distribution",
    lib_name = "player",
    maven_coordinates = "com.intuit.playerui:android:%s" % VERSION,
)

kt_jvm_junit5_test(
    name = "player-tests",
    srcs = glob(["src/test/java/**"]),
    associates = [":player_android_kt"],
    kotlinc_opts = "//jvm:test_options",
    test_package = "com.intuit.playerui.android",
    deps = [":player"] + test_deps,
)

lint(
    name = "player",
    srcs = glob(["src/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)
