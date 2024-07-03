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
    name = "empty",
    system_provided = True,
)

alias(
    name = "libc++_shared",
    actual = select({
        ":arm64-v8a": "//jvm/hermes/libs/arm64-v8a:libc++_shared",
        ":armeabi-v7a": "//jvm/hermes/libs/armeabi-v7a:libc++_shared",
        ":x86": "//jvm/hermes/libs/x86:libc++_shared",
        ":x86_64": "//jvm/hermes/libs/x86_64:libc++_shared",
        "//conditions:default": "empty",
    }),
    visibility = ["//visibility:public"],
)

java_library(
    name = "prebuilt-rn-libc++_shared-android",
    visibility = ["//visibility:public"],
    runtime_deps = [":libc++_shared"],
)

alias(
    name = "libfbjni",
    actual = select({
        ":arm64-v8a": "//jvm/hermes/libs/arm64-v8a:libfbjni",
        ":armeabi-v7a": "//jvm/hermes/libs/armeabi-v7a:libfbjni",
        ":x86": "//jvm/hermes/libs/x86:libfbjni",
        ":x86_64": "//jvm/hermes/libs/x86_64:libfbjni",
        "//conditions:default": "empty",
    }),
    visibility = ["//visibility:public"],
)

java_library(
    name = "prebuilt-rn-libfbjni-android",
    visibility = ["//visibility:public"],
    runtime_deps = [":libfbjni"],
)

alias(
    name = "libhermes",
    actual = select({
        ":arm64-v8a": "//jvm/hermes/libs/arm64-v8a:libhermes",
        ":armeabi-v7a": "//jvm/hermes/libs/armeabi-v7a:libhermes",
        ":x86": "//jvm/hermes/libs/x86:libhermes",
        ":x86_64": "//jvm/hermes/libs/x86_64:libhermes",
        "//conditions:default": "empty",
    }),
    visibility = ["//visibility:public"],
)

java_library(
    name = "prebuilt-rn-libhermes-android",
    visibility = ["//visibility:public"],
    runtime_deps = [":libhermes"],
)

alias(
    name = "libjsi",
    actual = select({
        ":arm64-v8a": "//jvm/hermes/libs/arm64-v8a:libjsi",
        ":armeabi-v7a": "//jvm/hermes/libs/armeabi-v7a:libjsi",
        ":x86": "//jvm/hermes/libs/x86:libjsi",
        ":x86_64": "//jvm/hermes/libs/x86_64:libjsi",
        "//conditions:default": "empty",
    }),
    visibility = ["//visibility:public"],
)

java_library(
    name = "prebuilt-rn-libjsi-android",
    visibility = ["//visibility:public"],
    runtime_deps = [":libjsi"],
)
