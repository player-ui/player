j2v8_prod_exports = [
    "//jvm/j2v8:j2v8-android",
]

j2v8_dev_exports = [
    "//jvm/j2v8:j2v8-android-debug",
]

hermes_exports = [
    "//jvm/hermes:hermes-android",
]

# TODO: Runtime dependencies should probably not be exports
main_exports = select({
    "//android/player:hermes_runtime": hermes_exports,
    "//android/player:j2v8_dev_runtime": j2v8_dev_exports,
    "//android/player:j2v8_prod_runtime": j2v8_prod_exports,
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
    "//plugins/beacon/jvm:beacon",
    "//plugins/pubsub/jvm:pubsub",
    "//plugins/coroutines/jvm:coroutines",
]

main_resources = [
    # TS core deps
    "//plugins/partial-match-fingerprint/core:core_native_bundle",
    "//core/partial-match-registry:partial-match-registry_native_bundle",
]

test_deps = [
    "@maven//:io_mockk_mockk",
    "//jvm/testutils",
    "//jvm/hermes:hermes-host",
    "@maven//:org_robolectric_robolectric",
    "@maven//:org_jetbrains_kotlinx_kotlinx_coroutines_test",
]
