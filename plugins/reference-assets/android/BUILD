load("@rules_jvm_external//:defs.bzl", "artifact")
load("//android:defs.bzl", "kt_android")

main_exports = [
    "//android/player",
]

main_deps = main_exports + [
    "//plugins/pending-transaction/jvm",
    "//plugins/reference-assets/jvm",
    artifact("androidx.compose.material:material"),
    artifact("androidx.compose.ui:ui"),
]

instrumented_test_deps = [
    "//android/testutils",
    "//jvm/j2v8:j2v8-all",
    # TODO: If we build a config for swapping between default android player runtimes,
    #  we could dynamically depend on this and make sure we run all android player tests against all supported runtimes
    # "//jvm/hermes:hermes-host",
    "//tools/mocks:jar",
]

kt_android(
    name = "reference-assets-android",
    instrumented_test_deps = instrumented_test_deps,
    main_deps = main_deps,
    main_exports = main_exports,
    plugins = ["//android:jetpack_compose_compiler_plugin"],
    # Disable explicit API mode for reference module
    main_opts = "//jvm:test_options",
)
