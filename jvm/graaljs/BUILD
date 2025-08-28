load("@rules_jvm_external//:defs.bzl", "artifact")
load("//jvm:defs.bzl", "kt_player_module")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    artifact("org.graalvm.js:js"),
    artifact("org.graalvm.js:js-scriptengine"),
    artifact("org.graalvm.sdk:graal-sdk"),
]

main_resources = glob(["src/main/resources/**"]) + [
    "//core/player:player_native_bundle"
]

test_deps = [
    "//jvm/testutils"
]

kt_player_module(
    name = "graaljs",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources,
    test_deps = test_deps,
    test_package = "com.intuit.playerui.graaljs",
)
