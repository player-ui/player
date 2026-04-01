load("@rules_jvm_external//:defs.bzl", "artifact")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//android:defs.bzl", "kt_android")

main_exports = [
    "//android/player",
    "//jvm/utils",

    artifact("junit:junit"),
]

main_deps = main_exports + [
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

# For use locally, to automatically pull in the *singular* configured runtime that should be tested against
kt_jvm_library(
    name = "with-runtime",
    visibility = ["//visibility:public"],
    exports = [
        ":testutils",
        "//jvm/hermes:hermes-host",
    ],
)
