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

cc_library(
    name = "libhermes_headers",
    hdrs = glob(["prefab/modules/libhermes/include/**/*.h"]),
    #    shared_library = select({
    #        ":arm64-v8a": "prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so",
    #        ":armeabi-v7a": "prefab/modules/libhermes/libs/android.armeabi-v7a/libhermes.so",
    #        ":x86": "prefab/modules/libhermes/libs/android.x86/libhermes.so",
    #        ":x86_64": "prefab/modules/libhermes/libs/android.x86_64/libhermes.so",
    #        "//conditions:default": "prefab/modules/libhermes/libs/android.arm64-v8a/libhermes.so",
    #    }),
    strip_include_prefix = "prefab/modules/libhermes/include",
    visibility = ["//visibility:public"],
)
