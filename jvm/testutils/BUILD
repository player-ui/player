load("@rules_jvm_external//:defs.bzl", "artifact")
load("//jvm:defs.bzl", "kt_player_module")

main_exports = [
    # "//jvm:kotlin_serialization",
    "//jvm/core",
    "//jvm/utils",
    "//jvm/j2v8:j2v8-all",
    # "//jvm/graaljs",
    # "//jvm/hermes",
    # "//plugins/common-types/jvm:common-types",
    # "//plugins/reference-assets/jvm:reference-assets",
    "//tools/mocks:jar",

    artifact("org.junit.jupiter:junit-jupiter-api")
]

main_deps = main_exports

kt_player_module(
    name = "testutils",
    main_deps = main_deps,
    main_exports = main_exports,
)
