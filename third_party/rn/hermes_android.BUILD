config_setting(
    name = "arm64-v8a",
    values = {
        "cpu": "arm64-v8a",
    },
)

config_setting(
    name = "armeabi-v7a",
    values = {
        "cpu": "armeabi-v7a",
    },
)

config_setting(
    name = "x86",
    values = {
        "cpu": "x86",
    },
)

config_setting(
    name = "x86_64",
    values = {
        "cpu": "x86_64",
    },
)

cc_import(
    name = "arm64-v8a_hermes",
    shared_library = ":prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so",
    visibility = ["//visibility:public"],
)

cc_import(
    name = "armeabi-v7a_hermes",
    shared_library = ":prefab/modules/libhermes/libs/android.armeabi-v7a/libhermes.so",
    visibility = ["//visibility:public"],
)

cc_import(
    name = "x86_hermes",
    shared_library = ":prefab/modules/libhermes/libs/android.x86/libhermes.so",
    visibility = ["//visibility:public"],
)

cc_import(
    name = "x86_64_hermes",
    shared_library = ":prefab/modules/libhermes/libs/android.x86_64/libhermes.so",
    visibility = ["//visibility:public"],
)

cc_library(
    name = "libhermes_headers",
    hdrs = glob(["prefab/modules/libhermes/include/**/*.h"]),
    strip_include_prefix = "prefab/modules/libhermes/include",
    visibility = ["//visibility:public"],
)

java_library(
    name = "prebuilt-rn-hermes-android",
    visibility = ["//visibility:public"],
    runtime_deps = select({
        ":arm64-v8a": [":arm64-v8a_hermes"],
        ":armeabi-v7a": [":armeabi-v7a_hermes"],
        ":x86": [":x86_hermes"],
        ":x86_64": [":x86_64_hermes"],
        "//conditions:default": [],
    }),
)
