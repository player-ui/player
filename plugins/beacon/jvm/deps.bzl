maven = []

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "//jvm:kotlin_serialization",
    "//plugins/set-time-out/jvm:set-time-out",
]

main_resources = [
    "//plugins/beacon/core:core_native_bundle",
]
