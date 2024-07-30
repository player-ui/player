maven = [
    "com.intuit.player:core-bridge:1.0.0",
]

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "//jvm:kotlin_serialization",
    "//plugins/set-time-out/jvm:set-time-out",
]

main_resources = [
    "//plugins/async-node/core:core_native_bundle",
]