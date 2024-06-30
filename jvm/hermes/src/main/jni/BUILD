load(":copy_output.bzl", "copy_output")

cc_library(
    name = "hermes_jni",
    srcs = [
        "JHermesRuntime.cpp",
        "JJSIValue.cpp",
        "OnLoad.cpp",
    ],
    hdrs = [
        "JHermesRuntime.h",
        "JJSIValue.h",
    ],
    copts = ["-std=c++17"],
    deps = [
        "@hermes",
        "@fbjni",
        # TODO: Wrap in select for Android so it uses NDK
        "@rules_jni//jni",
    ],
    alwayslink = True,
)

cc_binary(
    name = "libhermes_jni.so",
    linkshared = True,
    deps = [":hermes_jni"],
)

# Extract out our shared libraries for packaging so we can control where they're at in the JAR
copy_output(
    name = "libhermes",
    srcs = ["@hermes"],
    file = "libhermes.dylib",
)

copy_output(
    name = "libjsi",
    srcs = ["@hermes"],
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
