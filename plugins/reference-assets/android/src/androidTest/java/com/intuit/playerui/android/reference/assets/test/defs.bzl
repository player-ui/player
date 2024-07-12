load("//jvm/dependencies:versions.bzl", "versions")

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
    "//plugins/reference-assets/android:assets",
]
