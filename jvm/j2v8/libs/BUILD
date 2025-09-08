load("@rules_java//java:java_import.bzl", "java_import")

package(default_visibility = ["//jvm/j2v8:__pkg__"])

java_import(
    name = "j2v8_empty_compile_only",
    jars = [":j2v8_empty-6.1.0.jar"],
    neverlink = True,
    tags = ["maven:compile-only"],
)

java_import(
    name = "j2v8_macos",
    jars = [
        ":j2v8_macos_x86_64-6.1.0.jar",
        ":j2v8_macos_aarch_64-6.1.0.jar",
    ],
)

java_import(
    name = "j2v8_linux",
    jars = [":j2v8_linux_x86_64-6.1.0.jar"],
)
