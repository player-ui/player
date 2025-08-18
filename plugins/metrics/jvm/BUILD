load("@rules_jvm_external//:defs.bzl", "artifact")
load("//plugins:defs.bzl", "kt_player_plugin")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports

main_resources = [
    "//plugins/metrics/core:core_native_bundle",
]

test_deps = [
    "//jvm/testutils",
    artifact("io.mockk:mockk"),
]

kt_player_plugin(
    name = "metrics",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.plugins.metrics",
)
