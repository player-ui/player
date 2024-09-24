cc_import(
    name = "empty",
    system_provided = True,
)

alias(
    name = "libfbjni",
    actual = select({
        "//:arm64-v8a": "//jvm/hermes/libs/arm64-v8a:libfbjni",
        "//:armeabi-v7a": "//jvm/hermes/libs/armeabi-v7a:libfbjni",
        "//:x86": "//jvm/hermes/libs/x86:libfbjni",
        "//:x86_64": "//jvm/hermes/libs/x86_64:libfbjni",
        "//conditions:default": "empty",
    }),
    visibility = ["//visibility:public"],
)

alias(
    name = "libc++_shared",
    actual = select({
        "//:arm64-v8a": "//jvm/hermes/libs/arm64-v8a:libc++_shared",
        "//:armeabi-v7a": "//jvm/hermes/libs/armeabi-v7a:libc++_shared",
        "//:x86": "//jvm/hermes/libs/x86:libc++_shared",
        "//:x86_64": "//jvm/hermes/libs/x86_64:libc++_shared",
        "//conditions:default": "empty",
    }),
    visibility = ["//visibility:public"],
)
