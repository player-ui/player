load(":deps.bzl", "main_deps", "main_resources", "test_deps")
load("//jvm:build.bzl", "distribution")
load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_library")

#load("@grab_bazel_common//tools/databinding:databinding.bzl", "kt_db_android_library")
load("@junit//junit5-jupiter-starter-bazel:junit5.bzl", "kt_jvm_junit5_test")
load("@rules_player//kotlin:lint.bzl", "lint")

kt_android_library(
    name = "player",
    srcs = glob(["src/main/java/**/*.kt"]),
    custom_package = "com.intuit.player.android",
    enable_data_binding = True,
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    resources = main_resources,
    tags = ["maven_coordinates=com.intuit.player.android:player:{pom_version}"],
    visibility = ["//visibility:public"],
    deps = main_deps,
)

distribution(
    name = "player",
)

kt_jvm_junit5_test(
    name = "player-tests",
    srcs = glob(["src/test/java/**"]),
    associates = [":player_kt"],
    kotlinc_opts = "//jvm:test_options",
    test_package = "com.intuit.player.android",
    deps = [":player"] + test_deps,
)

lint(
    name = "player",
    srcs = glob(["src/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)
