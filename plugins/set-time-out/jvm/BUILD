load("//plugins:defs.bzl", "kt_player_plugin")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports

test_deps = [
    "//jvm/testutils:with-runtimes",
]

kt_player_plugin(
    name = "set-time-out",
    main_deps = main_deps,
    main_exports = main_exports,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.plugins.settimeout",
)
