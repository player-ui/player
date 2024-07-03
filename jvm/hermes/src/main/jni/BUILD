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
    # TODO: Wrap in select for Android so it dynamically uses NDK vs @rules_jni//jni
    deps = [
        # Android deps
        # TODO: make the below just the headers to push all linking to platform specific targets
        "@fbjni//:libfbjni_headers",
        "@rn_hermes_android//:libhermes_headers",
        "@react_native//:libjsi_headers",
        # Host deps
        #        "@fbjni//:host",
        #        "@hermes//:libjsi_headers",
        #        "@hermes//:host",
        #        "@rules_jni//jni",
    ],
    alwayslink = True,
)

# This is really only for host
cc_binary(
    name = "libhermes_jni.so",
    linkshared = True,
    deps = [
        ":hermes_jni_lib",
    ],
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

java_library(
    name = "resources",
    resource_strip_prefix = "jvm/hermes/src/main/jni",
    resources = [
        ":libhermes",
        ":libhermes_jni.so",
        ":libjsi",
    ],
    visibility = ["//visibility:public"],
)
