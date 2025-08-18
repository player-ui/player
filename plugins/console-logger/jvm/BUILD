load("@rules_jvm_external//:defs.bzl", "artifact")
load("//plugins:defs.bzl", "kt_player_plugin")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports

test_deps = [
    "//jvm/testutils",
    artifact("io.mockk:mockk"),
]

kt_player_plugin(
    name = "console-logger",
    main_deps = main_deps,
    main_exports = main_exports,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.plugins.consolelogger",
)
