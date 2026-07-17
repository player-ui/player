load("@rules_jvm_external//:defs.bzl", "artifact")
load("//android:defs.bzl", "kt_android")

main_exports = [
    "//android/player",
]

main_deps = main_exports + [
    "//plugins/a2ui/jvm",
    artifact("androidx.compose.material:material"),
]

instrumented_test_deps = [
    "//android/testutils:with-runtime",
    "//tools/mocks:jar",
]

kt_android(
    name = "a2ui-android",
    instrumented_test_deps = instrumented_test_deps,
    main_deps = main_deps,
    main_exports = main_exports,
    # Disable explicit API mode for the A2UI assets module
    main_opts = "//jvm:test_options",
    plugins = ["//android:jetpack_compose_compiler_plugin"],
)
