load(":deps.bzl", "main_deps", "test_deps")
load("@build_constants//:constants.bzl", "VERSION")
load("//jvm:build.bzl", "distribution")
load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@io_bazel_rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("@junit//junit5-jupiter-starter-bazel:junit5.bzl", "kt_jvm_junit5_test")
load("@rules_player//kotlin:lint.bzl", "lint")
load("@grab_bazel_common//tools/databinding:databinding.bzl", "kt_db_android_library")

kt_db_android_library(
    name = "player-mvvm",
    srcs = glob(["src/main/java/**/*.kt"]),
    custom_package = "com.intuit.playerui.android.mvvm",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    tags = ["maven_coordinates=com.intuit.playerui.android:player-mvvm:aar:%s" % VERSION],
    visibility = ["//visibility:public"],
    deps = main_deps,
)

distribution(
    name = "player-mvvm",
    lib_name = "player-mvvm-databinding",
    maven_coordinates = "com.intuit.playerui.android:player-mvvm:%s" % VERSION,
)

kt_jvm_junit5_test(
    name = "player-mvvm-tests",
    srcs = glob(["src/test/java/**/*.kt"]),
    kotlinc_opts = "//jvm:test_options",
    associates = ["//android/player:player-associates"],
    test_package = "com.intuit.playerui.android.mvvm",
    deps = [
        "//android/player:player",
        ":player-mvvm",
        "//android/player/src/test/java/android/util:android_utils_stub",
        "//android/player/src/test/java/com/intuit/playerui/android/utils:android_test_utils",
        "//android/player/src/test/java/com/intuit/playerui/android/utils:android_log_util"
    ] + test_deps,
)

lint(
    name = "player-mvvm",
    srcs = glob(["src/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)
