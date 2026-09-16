load("@rules_player//kotlin:defs.bzl", "kt_jvm_junit5_test")

# Guards the indy codegen contract end-to-end: Kotlin functions must still cross into a JS runtime
# when compiled with -Xlambdas=indy/-Xsam-conversions=indy (the Kotlin 2.x/Gradle default, KT-45375),
# rather than as named classes extending kotlin.jvm.internal.Lambda.
#
# This deliberately uses //jvm:test_options rather than a local option set, so the guard asserts on
# the codegen mode the repo actually ships. A local override would keep passing even if the repo-wide
# setting regressed - which is the failure this target exists to catch.
kt_jvm_junit5_test(
    name = "test",
    srcs = glob(["src/test/kotlin/**/*.kt"]),
    kotlinc_opts = "//jvm:test_options",
    test_package = "com.intuit.playerui.indy",
    deps = [
        "//jvm/testutils:with-runtimes",
    ],
)
