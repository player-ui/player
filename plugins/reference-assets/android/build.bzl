load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_local_test")
load("@rules_player//kotlin:lint.bzl", "lint")

def kt_asset_test(
        name,
        test_class,
        srcs = [],
        deps = []):
    kt_android_local_test(
        name = name,
        srcs = srcs,
        custom_package = "com.intuit.playerui.android.reference.assets",
        test_class = test_class,
        deps = deps + [
            "//plugins/mocks:jar",
            "//plugins/reference-assets/android/src/androidTest/java/com/intuit/playerui/android/reference/assets/test",
            "//jvm/j2v8:j2v8-all",
        ],
        resources = [
        ],
        manifest_values = {
            "minSdkVersion": "24",
        },
    )

    lint(
        name = name,
        srcs = native.glob(["**/*.kt"]),
        lint_config = "//jvm:lint_config",
    )
