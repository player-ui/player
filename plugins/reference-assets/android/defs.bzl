load("//jvm/dependencies:versions.bzl", "versions")
load("@rules_player//kotlin:defs.bzl", "lint")
load("@rules_kotlin//kotlin:android.bzl", "kt_android_local_test")

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
            "//tools/mocks:jar",
            "//android/testutils",
            "//jvm/j2v8:j2v8-all",
        ],
        resources = [
        ],
        manifest = "//plugins/reference-assets/android:src/main/AndroidManifest.xml",
    )
    lint(
        name = name,
        srcs = native.glob(["**/*.kt"]),
        lint_config = "//jvm:lint_config",
    )
