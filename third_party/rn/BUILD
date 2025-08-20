exports_files([
    "react_native.BUILD",
    "hermes_android.BUILD",
])

alias(
    name = "libhermes",
    actual = select({
        "//:android-arm64-v8a": "//third_party/rn/arm64-v8a:libhermes",
        "//:android-armeabi-v7a": "//third_party/rn/armeabi-v7a:libhermes",
        "//:android-x86": "//third_party/rn/x86:libhermes",
        "//:android-x86_64": "//third_party/rn/x86_64:libhermes",
    }),
    visibility = ["//visibility:public"],
)

alias(
    name = "libjsi",
    actual = select({
        "//:android-arm64-v8a": "//third_party/rn/arm64-v8a:libjsi",
        "//:android-armeabi-v7a": "//third_party/rn/armeabi-v7a:libjsi",
        "//:android-x86": "//third_party/rn/x86:libjsi",
        "//:android-x86_64": "//third_party/rn/x86_64:libjsi",
    }),
    visibility = ["//visibility:public"],
)
