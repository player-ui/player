load("@junit//junit5-jupiter-starter-bazel:junit5.bzl", "kt_jvm_junit5_test")
load("@rules_player//kotlin:lint.bzl", "lint")
load("//android/player:deps.bzl", "test_deps")

def kt_player_test(
        name,
        srcs = [],
        associates = [],
        deps = []):
    kt_jvm_junit5_test(
        name = name,
        srcs = srcs,
        associates = associates,
        kotlinc_opts = "//jvm:test_options",
        test_package = "com.intuit.playerui.android",
        deps = deps + [
            "//android/player:player",
            "//android/player/src/test/java/android/util:android_utils_stub",
            "//android/player/src/test/java/com/intuit/playerui/android/utils:android_test_utils",
            "//android/player/src/test/java/com/intuit/playerui/android/utils:android_log_util"] + test_deps,
    )

    lint(
        name = name,
        srcs = native.glob(["**/*.kt"]),
        lint_config = "//jvm:lint_config",
    )
