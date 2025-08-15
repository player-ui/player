load("//plugins:defs.bzl", "kt_player_plugin")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    # "//jvm:kotlin_serialization",
    "//plugins/set-time-out/jvm:set-time-out",
]

main_resources = [
    "//plugins/beacon/core:core_native_bundle",
]


kt_player_plugin(
    name = "beacon",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources,
    test_package = "com.intuit.playerui.plugins.beacon",
)
