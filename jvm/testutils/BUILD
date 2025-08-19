load("@rules_jvm_external//:defs.bzl", "artifact")
load("//jvm:defs.bzl", "kt_player_module")

main_exports = [
    "//jvm/core",
    "//jvm/utils",

    artifact("org.junit.jupiter:junit-jupiter-api")
]

main_deps = main_exports + [
    # TODO: We probably shouldn't include all runtimes by default, runtime test target is a per-integration decision
    "//jvm/j2v8:j2v8-all",
    "//jvm/graaljs",
    "//jvm/hermes",
    "//tools/mocks:jar",
]

kt_player_module(
    name = "testutils",
    main_deps = main_deps,
    main_exports = main_exports,
)
