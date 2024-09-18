exports_files([
    "react_native.BUILD",
    "hermes_android.BUILD",
])

alias(
    name = "libhermes",
    actual = select({
        "//:arm64-v8a": "//third_party/rn/arm64-v8a:libhermes",
        "//:armeabi-v7a": "//third_party/rn/armeabi-v7a:libhermes",
        "//:x86": "//third_party/rn/x86:libhermes",
        "//:x86_64": "//third_party/rn/x86_64:libhermes",
        "//conditions:default": "empty",
    }),
    visibility = ["//visibility:public"],
)
