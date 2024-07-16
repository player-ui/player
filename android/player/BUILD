load(":deps.bzl", "main_deps", "main_exports", "main_resources", "test_deps")
load("@build_constants//:constants.bzl", "VERSION")
load("@rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_kotlin//kotlin:core.bzl", "kt_kotlinc_options")
load("//jvm:defs.bzl", "distribution")
load("@rules_player//kotlin:defs.bzl", "kt_jvm_junit5_test", "lint")

kt_android_library(
    name = "player",
    srcs = glob(["src/main/java/**/*.kt"]),
    enable_data_binding = True,
    custom_package = "com.intuit.playerui.android",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    resources = main_resources,
    tags = ["maven_coordinates=com.intuit.playerui:android:aar:%s" % VERSION],
    visibility = ["//visibility:public"],
    exports = main_exports,
    deps = main_deps,
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
