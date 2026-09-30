load("@build_constants//:constants.bzl", "GROUP", "VERSION")
load("@rules_android//android:rules.bzl", "android_library")
load("@rules_jvm_external//:defs.bzl", "artifact")
load("@rules_kotlin//kotlin:core.bzl", "kt_kotlinc_options")
load("@rules_kotlin//kotlin:jvm.bzl", "kt_jvm_library")
load("//jvm:defs.bzl", "distribution", "kt_player_module")
load("//jvm:opts.bzl", "OPTINS")
load(":defs.bzl", "merge_jni_into_android_library")

# The JSI APIs use context receivers to require the runtime thread context. Enabling
# `x_context_receivers` repo-wide makes K2 reject `this@Outer` inside an extension whose receiver
# has the same type as the enclosing class as an ambiguous label - which is otherwise valid code
# (see RenderableAsset's render extensions elsewhere in the repo). So the flag is scoped to this
# module only, rather than added to the shared //jvm:main_options / //jvm:test_options.
#
# Context receivers are deprecated and removed in language version 2.2+, where these become
# `x_context_parameters` and every `context(Foo)` becomes `context(_: Foo)`.
kt_kotlinc_options(
    name = "main_options_with_context_receivers",
    jvm_target = "17",
    x_context_receivers = True,
    x_explicit_api_mode = "strict",
    x_lambdas = "indy",
    x_optin = OPTINS,
    x_sam_conversions = "indy",
)

kt_kotlinc_options(
    name = "test_options_with_context_receivers",
    jvm_target = "17",
    x_context_receivers = True,
    x_lambdas = "indy",
    x_optin = OPTINS,
    x_sam_conversions = "indy",
)

main_exports = [
    "//jvm/core",
    artifact("com.facebook.soloader:soloader"),
]

main_deps = main_exports + [
    "//plugins/console-logger/jvm",
    "//plugins/set-time-out/jvm",
    artifact("com.facebook.fbjni:fbjni-java-only"),
]

test_deps = [
    "@rules_kotlin//kotlin/compiler:kotlin-test",
    "//jvm/testutils",
    ":hermes-host",
]

kt_player_module(
    name = "hermes",
    main_deps = main_deps,
    main_exports = main_exports,
    main_opts = ":main_options_with_context_receivers",
    test_deps = test_deps,
    test_opts = ":test_options_with_context_receivers",
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
    # TODO: Hack - avoid publishing and depending on hermes-host, but configure it for use in this repo
    tags = ["maven_coordinates=%s:%s:%s" % (GROUP, "hermes", VERSION)],
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
