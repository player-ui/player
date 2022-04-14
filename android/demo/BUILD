load("@build_bazel_rules_android//android:rules.bzl", "android_binary")
load("@io_bazel_rules_kotlin//kotlin:jvm.bzl", "kt_jvm_import")
load("@io_bazel_rules_kotlin//kotlin:android.bzl", "kt_android_library")

load(":deps.bzl", "main_deps")

kt_android_library(
    name = "demo_lib",
    srcs = glob(["src/main/java/**"]),
    assets_dir = "src/main/assets",
    assets = glob(["src/main/assets/mocks/**"]),
    custom_package = "com.intuit.player.android.reference.demo",
    manifest = ":src/main/AndroidManifest.xml",
    resource_files = glob(["src/main/res/**"]),
    deps = main_deps,
)

android_binary(
    name = "demo",
    custom_package = "com.intuit.player.android.reference.demo",
    manifest = ":src/main/AndroidManifest.xml",
    multidex = "native",
    dex_shards = 10,
    enable_data_binding = True,
    deps = [
        ":demo_lib",
        "@android_j2v8//aar",
        "@maven//:org_jetbrains_kotlin_kotlin_reflect",
        "@maven//:androidx_databinding_databinding_common",
        "@maven//:androidx_databinding_databinding_runtime",
    ]
)

kt_jvm_import(
    name = "kotlinx_coroutines_core_jvm_fixed",
    jars = ["@kotlinx_coroutines_core_fixed//:v1/https/repo1.maven.org/maven2/org/jetbrains/kotlinx/kotlinx-coroutines-core-jvm/1.5.2/kotlinx-coroutines-core-jvm-1.5.2.jar"],
    deps = [
        ":sun_dependencies_neverlink",
    	"@maven//:org_jetbrains_kotlin_kotlin_stdlib_common",
    	"@maven//:org_jetbrains_kotlin_kotlin_stdlib_jdk8",
    ],
    visibility = ["//visibility:public"],
)

java_library(
    name = "sun_dependencies_neverlink",
    srcs = ["SignalHandler.java", "Signal.java"],
    neverlink = True
)


