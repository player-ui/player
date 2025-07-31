load("@build_constants//:constants.bzl", "GROUP", "VERSION")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//jvm:defs.bzl", "distribution", "kt_player_module")
load(":defs.bzl", "merge_jni_into_android_library")
load(":deps.bzl", "main_deps", "main_exports", "main_resources", "test_deps")

kt_player_module(
    name = "hermes",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources + glob(["src/main/resources/**"]),
    test_deps = test_deps,
    test_package = "com.intuit.playerui",
)

kt_jvm_library(
    name = "hermes-host",
    associates = [":hermes"],
    visibility = ["//visibility:public"],
    exports = [
        ":hermes",
        "//jvm/hermes/src/main/jni:resources",
    ],
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
    tags = ["maven_coordinates=%s:%s:aar:%s" % (GROUP, "hermes-android", VERSION)],
    exports = [":hermes"],
)

distribution(
    name = "hermes-android",
    lib_name = "hermes-android-merged",
    maven_coordinates = "%s:%s:%s" % (GROUP, "hermes-android", VERSION),
)
