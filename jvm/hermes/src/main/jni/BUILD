load(":copy_output.bzl", "copy_output")

cc_library(
    name = "hermes_jni_lib",
    srcs = [
        "JHermesRuntime.cpp",
        "JJSIValue.cpp",
        "OnLoad.cpp",
    ],
    hdrs = [
        "JHermesRuntime.h",
        "JJSIValue.h",
    ],
    # TODO: Likely need to add the flags to disable parts of Hermes that is excluded from MinRelSize release build
    copts = [
        "-std=c++17",

        # cmake Release
        # "-O3",
        # "-DNDEBUG",

        # cmake MinSizeRel
        # TODO: we should really create a config setting to map cmake build type to copts and use to pass to cmake builds too
        "-Os",
        "-DNDEBUG",
    ],
    visibility = ["//visibility:public"],
    deps = [
        # Just headers, let the binaries link for specific platforms
        "@fbjni//:libfbjni_headers",
        "@rn_hermes_android//:libhermes_headers",
        "@react_native//:libjsi_headers",
        # TODO: Definitely need this for host, but it breaks Android
        # "@rules_jni//jni",
    ],
    alwayslink = True,
)

# TODO: Hook up to transition and build aar rather than using android_binary
cc_binary(
    name = "libhermes_jni_android",
    linkshared = True,
    linkstatic = True,
    deps = [
        ":hermes_jni_lib",
        "//jvm/hermes/libs:libc++_shared",
        "//jvm/hermes/libs:libfbjni",
        "//jvm/hermes/libs:libjsi",
        "@rn_hermes_android//:libhermes",
    ],
)

# This is really only for host
cc_binary(
    name = "libhermes_jni.so",
    linkshared = True,
    deps = [":hermes_jni_lib"],
)

# Extract out our shared libraries for packaging so we can control where they're at in the JAR
copy_output(
    name = "libhermes",
    srcs = ["@hermes//:host"],
    file = "libhermes.dylib",
)

copy_output(
    name = "libjsi",
    srcs = ["@hermes//:host"],
    file = "libjsi.dylib",
)

copy_output(
    name = "libfbjni",
    srcs = ["@fbjni//:host"],
    file = "fbjni.dylib",
)

java_library(
    name = "resources",
    resource_strip_prefix = "jvm/hermes/src/main/jni",
    resources = [
        # TODO: Do we also need the c++ layer? I don't think so, just need to link the right things
        ":libfbjni",
        ":libhermes",
        ":libhermes_jni.so",
        ":libjsi",
    ],
    visibility = ["//visibility:public"],
)
