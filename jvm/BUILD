load("@rules_jvm_external//:defs.bzl", "artifact")
load("@rules_kotlin//kotlin:core.bzl", "define_kt_toolchain", "kt_compiler_plugin", "kt_kotlinc_options")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("@rules_kotlin//kotlin:lint.bzl", "ktlint_config")
load("//jvm:opts.bzl", "OPTINS")

exports_files([
    "pom.tpl",
    "empty.jar",
])

kt_compiler_plugin(
    name = "serialization_plugin",
    compile_phase = True,
    id = "org.jetbrains.kotlin.serialization",
    stubs_phase = True,
    deps = [
        "@rules_kotlin//kotlin/compiler:kotlinx-serialization-compiler-plugin",
    ],
)

kt_jvm_library(
    name = "kotlin_serialization",
    srcs = [],
    exported_compiler_plugins = [":serialization_plugin"],
    visibility = ["//visibility:public"],
    exports = [
        artifact("org.jetbrains.kotlinx:kotlinx-serialization-core-jvm"),
    ],
)

optins = OPTINS

# NOTE: x_lambdas/x_sam_conversions are set explicitly because rules_kotlin sets it to class mode by default
# may not be needed with a future version of rules_kotlin
# Common main Kotlin compiler options
kt_kotlinc_options(
    name = "main_options",
    jvm_target = "17",
    visibility = ["//visibility:public"],
    x_explicit_api_mode = "strict",
    x_lambdas = "indy",
    x_optin = optins,
    x_sam_conversions = "indy",
)

# Common test Kotlin compiler options
kt_kotlinc_options(
    name = "test_options",
    jvm_target = "17",
    visibility = ["//visibility:public"],
    x_lambdas = "indy",
    x_optin = optins,
    x_sam_conversions = "indy",
)

# Context receivers are only used by //jvm/hermes, and enabling them repo-wide makes K2 reject
# `this@Outer` inside an extension whose receiver has the same type as the enclosing class as an
# ambiguous label - which is otherwise valid code (see RenderableAsset's render extensions). Scope
# the flag to the module that needs it.
#
# Context receivers are deprecated and removed in language version 2.2+, where these become
# `x_context_parameters` and every `context(Foo)` becomes `context(_: Foo)`.
kt_kotlinc_options(
    name = "main_options_with_context_receivers",
    jvm_target = "17",
    visibility = ["//visibility:public"],
    x_context_receivers = True,
    x_explicit_api_mode = "strict",
    x_lambdas = "indy",
    x_optin = optins,
    x_sam_conversions = "indy",
)

kt_kotlinc_options(
    name = "test_options_with_context_receivers",
    jvm_target = "17",
    visibility = ["//visibility:public"],
    x_context_receivers = True,
    x_lambdas = "indy",
    x_optin = optins,
    x_sam_conversions = "indy",
)

ktlint_config(
    name = "lint_config",
    editorconfig = "//:.editorconfig",
    visibility = ["//visibility:public"],
)

# NOTE: the language version no longer implies a lambda codegen mode. K2 defaults to
# -Xlambdas=indy/-Xsam-conversions=indy (KT-45375), which the bridge used to break on; that
# dependency is gone, and TypedParameterTest in //jvm/core guards it. Don't reintroduce
# -Xlambdas=class here.
define_kt_toolchain(
    name = "kotlin_toolchain",
    api_version = "2.1",
    experimental_use_abi_jars = True,
    kotlinc_options = ":test_options",
    language_version = "2.1",
)

# target encapsulating supported runtimes to test against
kt_jvm_library(
    name = "supported_runtimes",
    visibility = ["//visibility:public"],
    exports = [
        # MARK: Disable GraalJS testing
        # "//jvm/graaljs",
        "//jvm/hermes:hermes-host",
        "//jvm/j2v8:j2v8-all",
    ],
)
