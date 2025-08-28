load("@rules_jvm_external//:defs.bzl", "artifact")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//android:defs.bzl", "kt_android")

main_exports = [
    "//android/player",
    "//jvm/utils",

    artifact("junit:junit"),
]

main_deps = main_exports + [
    # TODO: We probably shouldn't include all runtimes by default, runtime test target is a per-integration decision
    "//jvm/j2v8:j2v8-all",
    "//jvm/graaljs",
    "//jvm/hermes",

    "//plugins/common-types/jvm",
    "//plugins/pending-transaction/jvm",
    "//plugins/reference-assets/android",

    artifact("androidx.test:core"),
    artifact("androidx.test:runner"),
    artifact("org.jetbrains.kotlinx:kotlinx-coroutines-test"),
]

kt_android(
    name = "testutils",
    main_deps = main_deps,
)

kt_jvm_library(
    name = "with-runtimes",
    visibility = ["//visibility:public"],
    exports = [
        ":testutils",
        "//jvm:supported_runtimes",
    ],
)
