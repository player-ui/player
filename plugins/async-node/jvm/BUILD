load("@rules_jvm_external//:defs.bzl", "artifact")
load("//plugins:defs.bzl", "kt_player_plugin")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports

test_deps = [
    "//jvm/testutils",
    "//plugins/reference-assets/jvm:reference-assets",
    artifact("io.mockk:mockk"),
    artifact("org.amshove.kluent:kluent"),
]

main_resources = [
    "//plugins/async-node/core:core_native_bundle",
]

kt_player_plugin(
    name = "async-node",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.plugins.asyncnode",
)