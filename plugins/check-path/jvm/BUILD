load("//plugins:defs.bzl", "kt_player_plugin")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports

main_resources = [
    "//plugins/check-path/core:core_native_bundle",
]

test_deps = [
    "//jvm/testutils:with-runtimes",
]

kt_player_plugin(
    name = "check-path",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.plugins.checkpath",
)
