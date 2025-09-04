load("@rules_java//java:java_import.bzl", "java_import")
load("@rules_jvm_external//:defs.bzl", "artifact")
load("//android:defs.bzl", "kt_android")

# TODO: Hack for compile-only deps
java_import(
    name = "compose_compile_only",
    jars = ["//jvm:empty.jar"],
    neverlink = True,
    tags = ["maven:compile-only"],
    deps = [
        artifact("androidx.compose.material:material"),
    ],
)

main_exports = [
    "//jvm/core",

    artifact("androidx.databinding:viewbinding"),
    artifact("androidx.transition:transition"),
]

main_deps = main_exports + [
    # JVM plugin deps
    "//plugins/beacon/jvm",
    "//plugins/pubsub/jvm",
    "//plugins/coroutines/jvm",

    artifact("androidx.constraintlayout:constraintlayout"),
    artifact("androidx.lifecycle:lifecycle-viewmodel-ktx"),
    artifact("androidx.lifecycle:lifecycle-runtime-ktx"),

    # Compose deps (compile-only)
    # TODO: Split out into actual compose module to link properly
    ":compose_compile_only",
]

main_resources = [
    # TS core deps
    # TODO: Wrap as it's own plugin
    "//plugins/partial-match-fingerprint/core:core_native_bundle",
    # TODO: Wrap as it's own plugin
    "//core/partial-match-registry:partial-match-registry_native_bundle",
]

unit_test_deps = [
    "//jvm/testutils:with-runtimes",
    artifact("io.mockk:mockk"),
    artifact("org.jetbrains.kotlinx:kotlinx-coroutines-test"),
]

instrumented_test_deps = [
    "//android/testutils:with-runtime",
]

kt_android(
    # TODO: Maybe rename to player-android
    name = "android",

    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources,
    unit_test_deps = unit_test_deps,
    instrumented_test_deps = instrumented_test_deps,
    plugins = ["//android:jetpack_compose_compiler_plugin"],
    unit_test_package = "com.intuit.playerui.android",
)
