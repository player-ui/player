load("@rules_jvm_external//:defs.bzl", "artifact")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//jvm:defs.bzl", "kt_player_module")

main_exports = [
    "//jvm/core",
    "//jvm/utils",

    artifact("org.junit.jupiter:junit-jupiter-api"),
]

main_deps = main_exports + [
    "//tools/mocks:jar",
]

kt_player_module(
    name = "testutils",
    main_deps = main_deps,
    main_exports = main_exports,
)

kt_jvm_library(
    name = "with-runtimes",
    visibility = ["//visibility:public"],
    exports = [
        ":testutils",
        "//jvm:supported_runtimes",
    ],
)
