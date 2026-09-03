load("@rules_kotlin//kotlin:core.bzl", "kt_kotlinc_options")
load("@rules_player//kotlin:defs.bzl", "kt_jvm_junit5_test")
load("//jvm:opts.bzl", "OPTINS")

# Compiles this module the way a K2 consumer compiles theirs.
#
# K2 defaults to generating lambdas and SAM conversions through invokedynamic/LambdaMetafactory
# (KT-45375) instead of as named classes extending kotlin.jvm.internal.Lambda. Player must not depend
# on the latter, or consumers are forced to pin `-Xlambdas=class`/`-Xsam-conversions=class` to use it.
#
# These are per-target options, and the kotlinc bundled with rules_kotlin honors them independently
# of the toolchain's language_version - so this proves the indy contract while the repo as a whole is
# still pinned to 1.8, without waiting on the frontend flip.
kt_kotlinc_options(
    name = "indy_options",
    x_lambdas = "indy",
    x_optin = OPTINS,
    x_sam_conversions = "indy",
)

kt_jvm_junit5_test(
    name = "test",
    srcs = glob(["src/test/kotlin/**/*.kt"]),
    kotlinc_opts = ":indy_options",
    test_package = "com.intuit.playerui.indy",
    deps = [
        "//jvm/testutils:with-runtimes",
    ],
)
