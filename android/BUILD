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
