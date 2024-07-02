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

android_library(
    name = "hermes-android",
    # TODO: Build RN libjsi if we can
    # resources = ["@react_native//:libjsi.so"],
    tags = ["maven_coordinates=%s:%s:%s" % (DEFAULT_GROUP, "hermes-android", VERSION)],
    visibility = ["//visibility:public"],
    exports = [
        ":hermes",

        # TODO: Gonna look into if these are actually compatible
        "//jvm/hermes/libs:prebuilt-rn-libfbjni-android",
        "//jvm/hermes/libs:prebuilt-rn-libjsi-android",
        # Looks like this needs to pull in the library to be built for the app
        "//jvm/hermes/src/main/jni:hermes_jni_lib",
        "@maven//:com_facebook_fbjni_fbjni",
        "@rn_hermes_android//:prebuilt-rn-hermes-android",
    ],
    #    runtime_deps = ["//jvm/hermes/src/main/jni:libhermes_jni.so"],
)

distribution(
    name = "hermes-android",
    maven_coordinates = "%s:%s:%s" % (DEFAULT_GROUP, "hermes-android", VERSION),
)

java_binary(
    name = "app",
    main_class = "com.intuit.playerui.hermes.bridge.runtime.HermesRuntimeKt",
    runtime_deps = [
        ":fbjni",
        ":hermes",
        "//jvm/hermes/src/main/jni:resources",
    ],
)
