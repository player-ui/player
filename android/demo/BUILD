load("@rules_android//android:rules.bzl", "android_binary", "android_library")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_import")
load("@rules_kotlin//kotlin:android.bzl", "kt_android_library")
load(":defs.bzl", "main_deps", "test_deps")
load("@rules_player//kotlin:defs.bzl", "lint")

kt_android_library(
    name = "demo_lib",
    srcs = glob(["src/main/java/**"]),
    custom_package = "com.intuit.playerui.android.reference.demo",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    deps = main_deps,
)

android_binary(
    name = "demo",
    custom_package = "com.intuit.playerui.android.reference.demo",
    assets = glob(["src/main/assets/mocks/**"]),
    assets_dir = "src/main/assets",
    dex_shards = 3,
    enable_data_binding = True,
    manifest = ":src/main/AndroidManifest.xml",
    multidex = "native",
    deps = [
        ":demo_lib",
        "//jvm/j2v8:j2v8-android",
        "@android_j2v8//aar",
        "@maven//:androidx_databinding_databinding_common",
        "@maven//:androidx_databinding_databinding_runtime",
        "@maven//:org_jetbrains_kotlin_kotlin_reflect",
    ],
)

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

sh_test(
    name = "android_instrumentation_test",
    size = "large",
    timeout = "long",
    srcs = ["scripts/androidtest.sh"],
    data = [
        ":demo",
        ":demo_test_app",
        "@android_test_orchestrator_apk//file",
        "@android_test_services_apk//file",
    ],
)

lint(
    name = "demo",
    srcs = glob(["src/**/*.kt"]),
    lint_config = "//jvm:lint_config",
)
