load("@rules_android//android:rules.bzl", "android_binary", "android_library")
load("@rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_import")
load("@rules_kotlin//kotlin:android.bzl", "kt_android_library")
load("@rules_player//kotlin:defs.bzl", "lint")
load(":deps.bzl", "main_deps", "test_deps")

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
    assets = glob(["src/main/assets/mocks/**"]),
    assets_dir = "src/main/assets",
    custom_package = "com.intuit.playerui.android.reference.demo",
    dex_shards = 3,
    manifest = ":src/main/AndroidManifest.xml",
    multidex = "native",
    deps = [
        ":demo_lib",
        #        "@maven//:com_eclipsesource_j2v8_j2v8",
        #        "@maven//:com_facebook_react_hermes_android",
        #        "//jvm/hermes/libs:hermes-android",
        #        "//jvm/hermes/libs:jsi-android",
        #        "@maven//:org_jetbrains_kotlin_kotlin_reflect",
        #        "//jvm/hermes/libs:arm64-v8a-jsi",
        #        "//jvm/hermes/src/main/jni:hermes_jni",
        #        "//jvm/hermes/libs:armeabi-v7a-jsi",
        #        "//jvm/hermes/libs:x86_64_jsi",
        #        "//jvm/hermes/libs:x86_jsi",
    ],
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
