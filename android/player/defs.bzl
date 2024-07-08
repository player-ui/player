main_exports = [
    "//jvm/j2v8:j2v8-android",
]

main_deps = main_exports + [
    "@maven//:androidx_core_core_ktx",
    "@maven//:androidx_transition_transition",
    "@maven//:androidx_lifecycle_lifecycle_runtime_ktx",
    "@maven//:androidx_lifecycle_lifecycle_viewmodel_ktx",
    "@maven//:androidx_constraintlayout_constraintlayout",
    "@maven//:androidx_databinding_databinding_adapters",
    "@maven//:androidx_databinding_databinding_common",
    "@maven//:androidx_databinding_databinding_runtime",
    "@maven//:androidx_annotation_annotation",
    "@maven//:androidx_databinding_viewbinding",
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
    "@maven//:org_robolectric_robolectric",
    "@maven//:org_jetbrains_kotlinx_kotlinx_coroutines_test",
]