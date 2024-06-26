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

java_library(
    name = "resources",
    resource_strip_prefix = "jvm/hermes/src/main/jni",
    resources = [
        ":libhermes.dylib",
        ":libhermes_jni.so",
        ":libjsi.dylib",
    ],
    visibility = ["//visibility:public"],
)
