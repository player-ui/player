load("//jvm:defs.bzl", "kt_player_module")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    "//plugins/a2ui/jvm",
]

test_deps = [
    "//jvm/testutils:with-runtimes",
]

kt_player_module(
    name = "a2ui",
    main_deps = main_deps,
    main_exports = main_exports,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.a2ui",
)
