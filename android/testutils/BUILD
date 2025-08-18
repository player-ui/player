load("@rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_player//kotlin:defs.bzl", "lint")
load("@build_constants//:constants.bzl", "VERSION")
load("//jvm:defs.bzl", "distribution")

main_deps = [
    "@maven//:androidx_test_core",
    "@maven//:androidx_test_runner",
    "@maven//:junit_junit",
    "@maven//:org_robolectric_robolectric",
    "@maven//:org_jetbrains_kotlinx_kotlinx_coroutines_test",
    "//tools/mocks:jar",
    "@rules_robolectric//bazel:android-all",
    "//jvm/utils",
    "//plugins/common-types/jvm:common-types",
    "//plugins/pending-transaction/jvm:pending-transaction",
    "//plugins/reference-assets/android:reference-assets-android",
]

kt_android_library(
    name = "testutils_android",
    srcs = glob(["src/main/java/**/*.kt"]),
    custom_package = "com.intuit.playerui.android.testutils",
    manifest = ":src/main/AndroidManifest.xml",
    deps = main_deps,
)

android_library(
    name = "testutils",
    custom_package = "com.intuit.playerui.android.testutils",
    manifest = ":src/main/AndroidManifest.xml",
    tags = ["maven_coordinates=com.intuit.playerui.android:testutils:aar:%s" % VERSION],
    visibility = ["//visibility:public"],
    exports = [":testutils_android"],
    deps = main_deps,
)

distribution(
    name = "testutils",
    maven_coordinates = "com.intuit.playerui.android:testutils:%s" % VERSION,
)

lint(
    name = "testutils",
    srcs = glob(["src/main/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)