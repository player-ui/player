load("@rules_android//android:rules.bzl", "android_binary")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_import")
load("@rules_kotlin//kotlin:android.bzl", "kt_android_library")
load(":defs.bzl", "main_deps", "test_deps")
load("@rules_player//kotlin:defs.bzl", "lint")

kt_android_library(
    name = "demo_lib",
    srcs = glob(["src/main/java/**"]),
    assets = glob(["src/main/assets/mocks/**"]),
    assets_dir = "src/main/assets",
    custom_package = "com.intuit.playerui.android.reference.demo",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    deps = main_deps,
)

android_binary(
    name = "demo",
    custom_package = "com.intuit.playerui.android.reference.demo",
    dex_shards = 10,
    enable_data_binding = True,
    manifest = ":src/main/AndroidManifest.xml",
    multidex = "native",
    deps = [
        ":demo_lib",
        "//jvm/j2v8:j2v8-android",
        "@maven//:androidx_databinding_databinding_common",
        "@maven//:androidx_databinding_databinding_runtime",
        "@maven//:org_jetbrains_kotlin_kotlin_reflect",
    ],
)

#kt_jvm_import(
#    name = "kotlinx_coroutines_core_jvm_fixed",
#    jars = ["@kotlinx_coroutines_core_fixed//:v1/https/repo1.maven.org/maven2/org/jetbrains/kotlinx/kotlinx-coroutines-core-jvm/1.5.2/kotlinx-coroutines-core-jvm-1.5.2.jar"],
#    visibility = ["//visibility:public"],
#    deps = [
#        ":sun_dependencies_neverlink",
#        "@maven//:org_jetbrains_kotlin_kotlin_stdlib_common",
#        "@maven//:org_jetbrains_kotlin_kotlin_stdlib_jdk8",
#    ],
#)

java_library(
    name = "sun_dependencies_neverlink",
    srcs = [
        "Signal.java",
        "SignalHandler.java",
    ],
    neverlink = True,
)

kt_android_library(
    name = "demo_ui_test",
    srcs = glob(["src/androidTest/**/*.kt"]),
    deps = test_deps + [":demo_lib"],
)

android_binary(
    name = "demo_test_app",
    custom_package = "com.intuit.playerui.android.reference.demo",
    instruments = ":demo",
    manifest = ":src/androidTest/AndroidManifest.xml",
    deps = ["demo_ui_test"],
)

sh_binary(
    name = "install",
    srcs = ["scripts/androidinstall.sh"],
    data = [":demo"],
    deps = [],
)

#sh_test(
#    name = "android_instrumentation_test",
#    size = "large",
#    timeout = "long",
#    srcs = ["scripts/androidtest.sh"],
#    data = [
#        ":demo",
#        ":demo_test_app",
#        "@android_test_orchestrator_apk//file",
#        "@android_test_services_apk//file",
#    ],
#)

lint(
    name = "demo",
    srcs = glob(["src/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)
