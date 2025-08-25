load("@rules_jvm_external//:defs.bzl", "artifact")
load("//plugins:defs.bzl", "kt_player_plugin")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports

main_resources = [
    "//plugins/pubsub/core:core_native_bundle",
]

test_deps = [
    "//jvm/testutils",
    artifact("org.amshove.kluent:kluent"),
]

kt_player_plugin(
    name = "pubsub",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.plugins.pubsub",
)
