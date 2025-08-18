load("@bazel_skylib//rules:common_settings.bzl", "bool_flag")
load("@rules_java//java:java_library.bzl", "java_library")
load("//:cmake.bzl", "CMAKE_BUILD_TYPE_COPTS", "CMAKE_BUILD_TYPE_COPT_MAPPINGS")
load(":cc_binary_host_jni.bzl", "cc_library_host_jni")
load(":copy_shared_lib.bzl", "copy_shared_lib")

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
        "RuntimeScope.cpp",
    ],
    hdrs = [
        "JHermesRuntime.h",
        "JJSIValue.h",
        "RuntimeScope.h",
    ],
    copts = CMAKE_BUILD_TYPE_COPTS + select({
        # TODO: Using React Natives JSI doesn't contain microtask - come back to this if we build it ourselves
        ":should_include_jni": [
            "-DJSI_MICROTASK"
        ],
        "//conditions:default": [],
    }),
    linkopts = select({
        # Host build
        ":should_include_jni": [],
        # Android build
        "//conditions:default": [
            "-Wl,-z,max-page-size=16384",
            "-lunwind"
        ],
    }),
    visibility = ["//visibility:public"],
    deps = select({
        # Host build
        ":should_include_jni": [
            "@bazel_tools//tools/jdk:jni",
            "@fbjni//:host",
            "@hermes//:host",
        ],
        # Android build
        "//conditions:default": [
            "@fbjni_artifact//:libfbjni_headers",
            "@react_native//:libjsi_headers",
            "@rn_hermes_android//:libhermes_headers",
        ],
    }),
    alwayslink = True,
)

# Trigger transition for :should_include_jni (makes it so we have a target that is for host, rather than needing to specify on the command line)
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
copy_shared_lib(
    name = "libhermes",
    srcs = ["@hermes//:host"],
)

copy_shared_lib(
    name = "libjsi",
    srcs = ["@hermes//:host"],
)

copy_shared_lib(
    name = "libfbjni",
    srcs = ["@fbjni//:host"],
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
