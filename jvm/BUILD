load("@rules_kotlin//kotlin:core.bzl", "define_kt_toolchain", "kt_compiler_plugin", "kt_kotlinc_options")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("@rules_kotlin//kotlin:lint.bzl", "ktlint_config")
load("//jvm/dependencies:versions.bzl", "versions")

exports_files([
    "pom.tpl",
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
    tags = ["maven_coordinates=org.jetbrains.kotlinx:kotlinx-serialization-core-jvm:%s" % versions.kotlin.serialization],
    visibility = ["//visibility:public"],
    exports = [
        "@maven//:org_jetbrains_kotlinx_kotlinx_serialization_core_jvm",
    ],
)

optins = [
    "kotlin.RequiresOptIn",
    "com.intuit.playerui.core.utils.InternalPlayerApi",
    "com.intuit.playerui.core.experimental.ExperimentalPlayerApi",
    "kotlinx.serialization.ExperimentalSerializationApi",
    "kotlinx.coroutines.ExperimentalCoroutinesApi",
    "kotlin.contracts.ExperimentalContracts",
]

# Common main Kotlin compiler options
kt_kotlinc_options(
    name = "main_options",
    visibility = ["//visibility:public"],
    x_context_receivers = True,
    x_explicit_api_mode = "strict",
    x_optin = optins,
)

# Common test Kotlin compiler options
kt_kotlinc_options(
    name = "test_options",
    visibility = ["//visibility:public"],
    x_context_receivers = True,
    x_optin = optins,
)

ktlint_config(
    name = "lint_config",
    visibility = ["//visibility:public"],
)

define_kt_toolchain(
    name = "kotlin_toolchain",
    api_version = "1.7",
    kotlinc_options = ":test_options",
    language_version = "1.7",
)
