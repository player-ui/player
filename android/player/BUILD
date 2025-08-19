load("@bazel_skylib//rules:common_settings.bzl", "string_flag")
load("@rules_jvm_external//:defs.bzl", "artifact")
load("//android:defs.bzl", "kt_android")

string_flag(
    name = "runtime",
    build_setting_default = "j2v8",
    values = [
        "j2v8",
        "j2v8-debug",
        "hermes",
    ],
)

config_setting(
    name = "j2v8_runtime",
    flag_values = {":runtime": "j2v8"},
)

config_setting(
    name = "j2v8_debug_runtime",
    flag_values = {":runtime": "j2v8-debug"},
)

config_setting(
    name = "hermes_runtime",
    flag_values = {":runtime": "hermes"},
)

# TODO: Runtime dependencies should probably not be exports
main_exports = ["//jvm/core"] + select({
    "//android/player:j2v8_runtime": ["//jvm/j2v8:j2v8-android"],
    "//android/player:j2v8_debug_runtime": ["//jvm/j2v8:j2v8-android-debug"],
    "//android/player:hermes_runtime": ["//jvm/hermes:hermes-android"],
    "//conditions:default": [],
})

main_deps = main_exports + [
    "@maven//:androidx_databinding_viewbinding",
    "@maven//:androidx_annotation_annotation",
    "@maven//:androidx_core_core_ktx",
    "@maven//:androidx_transition_transition",
    "@maven//:androidx_lifecycle_lifecycle_runtime_ktx",
    "@maven//:androidx_lifecycle_lifecycle_viewmodel_ktx",
    "@maven//:androidx_constraintlayout_constraintlayout",

    # JVM plugin deps
    "//plugins/beacon/jvm",
    "//plugins/pubsub/jvm",
    "//plugins/coroutines/jvm",

    # Compose deps (compile-only)
    # ":compose_compile_only",


    "@maven//:androidx_appcompat_appcompat",
    "@maven//:androidx_activity_activity_compose",
    "@maven//:androidx_compose_foundation_foundation",
    "@maven//:androidx_compose_foundation_foundation_layout",
    "@maven//:androidx_compose_runtime_runtime",
    "@maven//:androidx_compose_ui_ui",
    "@maven//:androidx_compose_ui_ui_tooling",
]

main_resources = [
    # TS core deps
    # TODO: Wrap as it's own plugin
    "//plugins/partial-match-fingerprint/core:core_native_bundle",
    # TODO: Wrap as it's own plugin
    "//core/partial-match-registry:partial-match-registry_native_bundle",
]

unit_test_deps = [
    "//jvm/testutils",
    artifact("io.mockk:mockk"),
    artifact("org.jetbrains.kotlinx:kotlinx-coroutines-test")
]

instrumented_test_deps = [
    "//android/testutils"
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

# java_import(
#     name = "compose_compile_only",
#     jars = [],
#     neverlink = True,
#     tags = ["maven:compile-only"],
#     deps = [
#         "@maven//:androidx_appcompat_appcompat",
#         "@maven//:androidx_activity_activity_compose",
#         "@maven//:androidx_compose_foundation_foundation",
#         "@maven//:androidx_compose_foundation_foundation_layout",
#         "@maven//:androidx_compose_runtime_runtime",
#         "@maven//:androidx_compose_ui_ui",
#         "@maven//:androidx_compose_ui_ui_tooling",
#     ]
# )
