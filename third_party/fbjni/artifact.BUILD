cc_import(
    name = "arm64-v8a_libfbjni",
    shared_library = "jni/arm64-v8a/libfbjni.so",
)

cc_import(
    name = "armeabi-v7a_libfbjni",
    shared_library = "jni/armeabi-v7a/libfbjni.so",
)

cc_import(
    name = "x86_libfbjni",
    shared_library = "jni/x86/libfbjni.so",
)

cc_import(
    name = "x86_64_libfbjni",
    shared_library = "jni/x86_64/libfbjni.so",
)

cc_import(
    name = "arm64-v8a_libc++_shared",
    shared_library = "jni/arm64-v8a/libc++_shared.so",
)

cc_import(
    name = "armeabi-v7a_libc++_shared",
    shared_library = "jni/armeabi-v7a/libc++_shared.so",
)

cc_import(
    name = "x86_libc++_shared",
    shared_library = "jni/x86/libc++_shared.so",
)

cc_import(
    name = "x86_64_libc++_shared",
    shared_library = "jni/x86_64/libc++_shared.so",
)

cc_import(
    name = "empty",
    system_provided = True,
)

alias(
    name = "libfbjni",
    actual = select({
        "@player//:android-arm64-v8a": ":arm64-v8a_libfbjni",
        "@player//:android-armeabi-v7a": ":armeabi-v7a_libfbjni",
        "@player//:android-x86": ":x86_libfbjni",
        "@player//:android-x86_64": ":x86_64_libfbjni",
    }),
    visibility = ["//visibility:public"],
)

alias(
    name = "libc++_shared",
    actual = select({
        "@player//:android-arm64-v8a": ":arm64-v8a_libc++_shared",
        "@player//:android-armeabi-v7a": ":armeabi-v7a_libc++_shared",
        "@player//:android-x86": ":x86_libc++_shared",
        "@player//:android-x86_64": ":x86_64_libc++_shared",
    }),
    visibility = ["//visibility:public"],
)

INCLUDE_DIR = "prefab/modules/fbjni/include"
cc_library(
    name = "libfbjni_headers",
    hdrs = glob(["{}/fbjni/**/*.h".format(INCLUDE_DIR)]),
    strip_include_prefix = INCLUDE_DIR,
    visibility = ["//visibility:public"],
)
