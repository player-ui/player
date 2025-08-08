main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    # "//jvm:kotlin_serialization",
]

test_deps = [
    "//plugins/reference-assets/android:assets",
]

main_resources = [
    "//plugins/async-node/core:core_native_bundle",
]