load(":deps.bzl", "main_deps", "main_exports", "main_resources", "test_deps")
load("@build_constants//:constants.bzl", "VERSION")
load("//jvm:build.bzl", "distribution")
load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@io_bazel_rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//android/player:build.bzl", "kt_player_test")
load("@rules_player//kotlin:lint.bzl", "lint")
load("@grab_bazel_common//tools/databinding:databinding.bzl", "kt_db_android_library")

kt_db_android_library(
    name = "player",
    srcs = glob(["src/main/java/**/*.kt"]),
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
    lib_name = "player-databinding",
    maven_coordinates = "com.intuit.playerui:android:%s" % VERSION,
)

kt_player_test(
    name = "player-tests",
    srcs = [
        "src/test/java/com/intuit/playerui/android/AndroidPlayerTest.kt",
        "src/test/java/com/intuit/playerui/android/AssetContextTest.kt",
        "src/test/java/com/intuit/playerui/android/BrokenAssetTest.kt"
    ],
    associates = [":player-kotlin"]
)

filegroup(
    name = "manifest",
    srcs = ["src/main/AndroidManifest.xml"],
    visibility = ["//visibility:public"]
)

lint(
    name = "player",
    srcs = glob(["src/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)
