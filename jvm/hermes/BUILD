load("@build_constants//:constants.bzl", "VERSION")
load("//jvm:defs.bzl", "DEFAULT_GROUP", "distribution", "kt_player_module")
load(":deps.bzl", "main_deps", "main_exports", "main_resources", "test_deps")

java_library(
    name = "fbjni",
    resource_strip_prefix = "external/fbjni",
    resources = ["@fbjni//:host"],
)

kt_player_module(
    name = "hermes",
    main_deps = main_deps,
    main_exports = main_exports,
    main_resources = main_resources + glob(["src/main/resources/**"]),
    test_deps = test_deps,
    test_package = "com.intuit.playerui",
)

# TODO: This should be the thing that contains the resource delegate loader source code and auto-initializer
java_library(
    name = "hermes-host",
    exports = [
        ":hermes",
        "//jvm/hermes/src/main/jni:resources",
    ],
)

android_library(
    name = "hermes-android",
    tags = ["maven_coordinates=%s:%s:%s" % (DEFAULT_GROUP, "hermes-android", VERSION)],
    visibility = ["//visibility:public"],
    exports = [
        # Kotlin Hermes JNI Runtime
        ":hermes",

        # Prebuilt TODO: We'd like to build all these at some point
        "//jvm/hermes/libs:prebuilt-rn-libc++_shared-android",
        "//jvm/hermes/libs:prebuilt-rn-libfbjni-android",
        "//jvm/hermes/libs:prebuilt-rn-libjsi-android",
        "@rn_hermes_android//:libhermes",
        "//jvm/hermes/src/main/jni:hermes_jni_lib",
        # NOTE: Keep this so we get the transitive dep in the POM - unless we bundle everything together into 1 so
        #        "@maven//:com_facebook_fbjni_fbjni",
        #        "@maven//:com_facebook_react_hermes_android",
    ],
)

distribution(
    name = "hermes-android",
    maven_coordinates = "%s:%s:%s" % (DEFAULT_GROUP, "hermes-android", VERSION),
)

# TODO: This probably isn't necessary anymore
java_binary(
    name = "app",
    main_class = "com.intuit.playerui.hermes.bridge.runtime.HermesRuntimeKt",
    runtime_deps = [
        # TODO: Swap to hermes-host w/ app src
        ":fbjni",
        ":hermes",
        "//jvm/hermes/src/main/jni:resources",
    ],
)
