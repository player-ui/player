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

# This is the only one we aren't pulling from AARs or building from source (for RN)
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
