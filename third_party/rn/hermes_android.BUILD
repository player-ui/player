# TODO: Enable platform support for detecting Android
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
    name = "arm64-v8a_libhermes",
    shared_library = "jni/arm64-v8a/libhermes.so",
)

cc_import(
    name = "armeabi-v7a_libhermes",
    shared_library = "jni/armeabi-v7a/libhermes.so",
)

cc_import(
    name = "x86_libhermes",
    shared_library = "jni/x86/libhermes.so",
)

cc_import(
    name = "x86_64_libhermes",
    shared_library = "jni/x86_64/libhermes.so",
)

cc_import(
    name = "empty",
    system_provided = True,
)

alias(
    name = "libhermes",
    actual = select({
        ":arm64-v8a": ":arm64-v8a_libhermes",
        ":armeabi-v7a": ":armeabi-v7a_libhermes",
        ":x86": ":x86_libhermes",
        ":x86_64": ":x86_64_libhermes",
        "//conditions:default": ":empty",
    }),
    visibility = ["//visibility:public"],
)

INCLUDE_DIR = "prefab/modules/libhermes/include"
cc_library(
    name = "libhermes_headers",
    hdrs = glob(["{}/hermes/**/*.h".format(INCLUDE_DIR)]),
    strip_include_prefix = INCLUDE_DIR,
    visibility = ["//visibility:public"],
)
