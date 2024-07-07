load("@bazel_skylib//rules:common_settings.bzl", "bool_flag")
load(":cc_binary_host_jni.bzl", "cc_library_host_jni")
load(":copy_output.bzl", "copy_output")

# Functionally, represents non-Android builds because NDK JNI will be attached by default
# Transitioned with cc_library_host_jni
bool_flag(
    name = "include_jni",
    build_setting_default = False,
)

config_setting(
    name = "should_include_jni",
    flag_values = {
        ":include_jni": "true",
    },
)

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
    ] + select({
        # TODO: Using React Natives JSI doesn't contain microtask - come back to this if we build it ourselves
        ":should_include_jni": ["-DJSI_MICROTASK"],
        "//conditions:default": [],
    }),
    visibility = ["//visibility:public"],
    deps = [
        # Just headers, let the binaries link for specific platforms
        "@fbjni//:libfbjni_headers",
    ] + select({
        # Host build
        ":should_include_jni": [
            "@bazel_tools//tools/jdk:jni",
            "@hermes//:host",
        ],
        # Android build
        "//conditions:default": [
            "@react_native//:libjsi_headers",
            "@rn_hermes_android//:libhermes_headers",
        ],
    }),
    alwayslink = True,
)

# Trigger transition for :should_include_jni
cc_library_host_jni(
    name = "hermes_jni_lib_host",
    cc_library = ":hermes_jni_lib",
)

# This is really only for host
cc_binary(
    name = "libhermes_jni.so",
    linkshared = True,
    deps = [":hermes_jni_lib_host"],
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
        ":libfbjni",
        ":libhermes",
        ":libhermes_jni.so",
        ":libjsi",
    ],
    visibility = ["//visibility:public"],
)
