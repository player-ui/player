load("@rules_jvm_external//:defs.bzl", "artifact")
load("//plugins:defs.bzl", "kt_player_plugin")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    artifact("org.slf4j:slf4j-api"),
]

test_deps = [
    artifact("ch.qos.logback:logback-classic"),
]

kt_player_plugin(
    name = "slf4j-logger",
    main_deps = main_deps,
    main_exports = main_exports,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.plugins.logging.slf4j",
)
