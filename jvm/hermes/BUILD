load("@build_constants//:constants.bzl", "VERSION")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//jvm:defs.bzl", "DEFAULT_GROUP", "distribution", "kt_player_module")
load(":defs.bzl", "merge_jni_into_android_library")
load(":deps.bzl", "main_deps", "main_exports", "main_resources", "test_deps")

kt_jvm_library(
    name = "hermes",
    srcs = glob(["src/main/**/*.kt"]),
    deps = main_deps,
    exports = main_exports,
    resources = main_resources + glob(["src/main/resources/**"]),
)

kt_jvm_library(
    name = "hermes-host",
    associates = [":hermes"],
    tags = ["maven_coordinates=%s:%s:%s" % (DEFAULT_GROUP, "hermes-m1", VERSION)],
    visibility = ["//visibility:public"],
    exports = [
        ":hermes",
        "//jvm/hermes/src/main/jni:resources",
    ],
)

distribution(
    name = "hermes-host.release",
    lib_name = "hermes-host",
    maven_coordinates = "%s:%s:%s" % (DEFAULT_GROUP, "hermes-m1", VERSION),
)

android_library(
    name = "hermes-android-lib",
    custom_package = "com.intuit.playerui.hermes",
    manifest = ":AndroidManifest.xml",
    visibility = ["//visibility:public"],
    # Kotlin Hermes JNI Runtime
    exports = [":hermes"],
)

merge_jni_into_android_library(
    name = "hermes-android",
    android_library = ":hermes-android-lib",
    cc_libs = [
        "@fbjni_artifact//:libc++_shared",
        "@fbjni_artifact//:libfbjni",
        "//third_party/rn:libjsi",
        "//jvm/hermes/src/main/jni:hermes_jni_lib",
        "//third_party/rn:libhermes",
    ],
    cc_name = "hermes_jni",
    tags = ["maven_coordinates=%s:%s:aar:%s" % (DEFAULT_GROUP, "hermes-android", VERSION)],
    exports = [":hermes"],
)

distribution(
    name = "hermes-android",
    lib_name = "hermes-android-merged",
    maven_coordinates = "%s:%s:%s" % (DEFAULT_GROUP, "hermes-android", VERSION),
)
