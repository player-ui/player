load("@bazel_skylib//rules:common_settings.bzl", "string_flag")
load("@rules_jvm_external//:defs.bzl", "artifact")
load("@rules_kotlin//kotlin:core.bzl", "kt_compiler_plugin")

kt_compiler_plugin(
    name = "jetpack_compose_compiler_plugin",
    id = "androidx.compose.compiler.plugins.kotlin",
    options = {"sourceInformation": "true"},
    target_embedded_compiler = True,
    visibility = ["//visibility:public"],
    deps = [artifact("org.jetbrains.kotlin:kotlin-compose-compiler-plugin-embeddable")],
)

string_flag(
    name = "runtime",
    build_setting_default = "hermes",
    values = [
        "j2v8",
        "hermes",
    ],
)

config_setting(
    name = "j2v8_runtime",
    flag_values = {":runtime": "j2v8"},
)

config_setting(
    name = "hermes_runtime",
    flag_values = {":runtime": "hermes"},
)
