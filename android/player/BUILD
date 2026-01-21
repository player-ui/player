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
    artifact("androidx.test:core"),
]

instrumented_test_deps = [
    "//jvm/testutils",
    "//android/testutils:with-runtime",
    artifact("io.mockk:mockk"),
    artifact("org.jetbrains.kotlinx:kotlinx-coroutines-test"),
    artifact("androidx.test:core"),
    "//jvm:kotlin_serialization"
]

# TODO: Update this to be updated automatically instead of maintaining a list manually
instrumented_test_classes = ['com.intuit.playerui.android.AndroidPlayerTest', 'com.intuit.playerui.android.AssetContextTest', 'com.intuit.playerui.android.AssetContextAndroidTest', 'com.intuit.playerui.android.renderer.NestedAssetTest', 'com.intuit.playerui.android.renderer.ThrowingAssetTest', 'com.intuit.playerui.android.renderer.HydrationScopeTest', 'com.intuit.playerui.android.renderer.SimpleAssetTest', 'com.intuit.playerui.android.renderer.BrokenAssetTest', 'com.intuit.playerui.android.extensions.IntoKtTest', 'com.intuit.playerui.android.registry.RegistryPluginTest']

kt_android(
    # TODO: Maybe rename to player-android
    name = "android",

    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources,
    unit_test_deps = unit_test_deps,
    main_opts = "//jvm:test_options",
    instrumented_test_deps = instrumented_test_deps,
    instrumented_test_classes = instrumented_test_classes,
    plugins = ["//android:jetpack_compose_compiler_plugin"],
    unit_test_package = "com.intuit.playerui.android"
)