load("@rules_jvm_external//:defs.bzl", "artifact")
load("@rules_player//kotlin:defs.bzl", "kt_android")

main_exports = [
    "//android/player",
]

main_deps = main_exports + [
    "//plugins/pending-transaction/jvm:pending-transaction",
    "//plugins/reference-assets/jvm:reference-assets",
    # TODO: Somehow not including any of this is fine
    # artifact("androidx.activity:activity-compose"),
    # artifact("androidx.appcompat:appcompat"),
    # artifact("androidx.compose.foundation:foundation"),
    # artifact("androidx.compose.foundation:foundation-layout"),
    # artifact("androidx.compose.runtime:runtime"),
    # artifact("androidx.compose.ui:ui"),
    # artifact("androidx.compose.ui:ui-tooling"),
]

instrumented_test_deps = [
    "//android/testutils",
]

kt_android(
    name = "reference-assets-android",
    instrumented_test_deps = instrumented_test_deps,
    main_deps = main_deps,
    main_exports = main_exports,
    plugins = ["//android/player:jetpack_compose_compiler_plugin"],
)
