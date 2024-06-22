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
        "ValueHelpers.h",
    ],
    copts = ["-std=c++17"],
    visibility = ["//visibility:public"],
    deps = [
        "//jvm/hermes/src/main/cxx:lib",
        "@fbjni",
        # TODO: Wrap in select for Android so it uses NDK
        "@rules_jni//jni",
    ],
    alwayslink = True,
)

cc_binary(
    name = "libhermes_jni.so",
    linkshared = True,
    visibility = ["//visibility:public"],
    deps = [":hermes_jni"],
)

exports_files([
    "libhermes.dylib",
    "libjsi.dylib",
])
