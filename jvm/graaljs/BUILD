load("//jvm:defs.bzl", "kt_player_module")

main_exports = [
    "//jvm/core",
]

main_deps = main_exports + [
    # "//jvm:kotlin_serialization",
    "@maven//:org_graalvm_js_js",
    "@maven//:org_graalvm_js_js_scriptengine",
    "@maven//:org_graalvm_sdk_graal_sdk",
]

main_resources = glob(["src/main/resources/**"]) + [
    "//core/player:player_native_bundle"
]

kt_player_module(
    name = "graaljs",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources,
    test_package = "com.intuit.playerui.graaljs",
)
