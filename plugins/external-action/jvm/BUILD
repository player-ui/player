load("//plugins:defs.bzl", "kt_player_plugin")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "//plugins/set-time-out/jvm",
]

main_resources = [
    "//plugins/external-action/core:core_native_bundle",
]

test_deps = [
    "//jvm/testutils",
]

kt_player_plugin(
    name = "external-action",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources,
    test_deps = test_deps,
    # TODO: Reformat package
    test_package = "com.intuit.playerui.plugins.externalAction",
)
