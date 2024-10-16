load("@bazel_skylib//rules:common_settings.bzl", "string_flag")
load("@build_constants//:constants.bzl", "VERSION")
load("@rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_kotlin//kotlin:core.bzl", "kt_kotlinc_options")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("@rules_player//kotlin:defs.bzl", "kt_jvm_junit5_test", "lint")
load("//jvm:defs.bzl", "distribution")
load(":deps.bzl", "main_deps", "main_exports", "main_resources", "test_deps")

string_flag(
    name = "runtime",
    build_setting_default = "j2v8",
    values = [
        "j2v8",
        "j2v8-debug",
        "hermes",
    ],
)

config_setting(
    name = "j2v8_runtime",
    flag_values = {":runtime": "j2v8"},
)

config_setting(
    name = "j2v8_debug_runtime",
    flag_values = {":runtime": "j2v8-debug"},
)

config_setting(
    name = "hermes_runtime",
    flag_values = {":runtime": "hermes"},
)

kt_android_library(
    name = "player_android",
    srcs = glob(["src/main/java/**/*.kt"]),
    custom_package = "com.intuit.playerui.android",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    resources = main_resources,
    deps = main_deps,
)

android_library(
    name = "player",
    custom_package = "com.intuit.playerui.android",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    tags = ["maven_coordinates=com.intuit.playerui:android:aar:%s" % VERSION],
    visibility = ["//visibility:public"],
    exports = [":player_android"] + main_exports,
    deps = main_deps,
)

distribution(
    name = "player",
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
