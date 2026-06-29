load("@rules_jvm_external//:defs.bzl", "artifact")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//android:defs.bzl", "kt_android")

main_exports = [
    "//android/player",
    "//jvm/utils",

    artifact("junit:junit"),
]

main_deps = main_exports + [
    "//plugins/pending-transaction/jvm",
    "//plugins/reference-assets/android",

    artifact("androidx.activity:activity"),
    artifact("androidx.test:core"),
    artifact("androidx.test:runner"),
    artifact("org.jetbrains.kotlinx:kotlinx-coroutines-test"),
]

instrumented_unit_test_deps = main_deps + [
    ":testutils_android",
    artifact("com.google.guava:guava"),
    artifact("org.robolectric:robolectric"),
    artifact("org.robolectric:annotations"),
]

kt_android(
    name = "testutils_android",
    main_deps = main_deps,
)

kt_android(
    name = "instrumented_unit_testutils_android",
    main_srcs = glob(["src/instrumented_unit_test_main/kotlin/**/*.kt"]),
    main_deps = instrumented_unit_test_deps,
)

# For use locally, to automatically pull in the *singular* configured runtime that should be tested against
kt_jvm_library(
    name = "with-runtime",
    visibility = ["//visibility:public"],
    exports = [
        ":instrumented_unit_testutils_android",
        "//jvm/hermes:hermes-host",
    ],
)
