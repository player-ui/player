load("@rules_foreign_cc//foreign_cc:defs.bzl", "cmake")
load("@player//third_party/fbjni:extract_headers.bzl", "extract_headers")

filegroup(
    name = "working_directory",
    srcs = glob(["**"]),
)

cc_library(
    name = "libfbjni_headers",
    hdrs = glob(["cxx/fbjni/**/*.h"], allow_empty=True),
    strip_include_prefix = "cxx",
    visibility = ["//visibility:public"],
)

extract_headers(
    name = "jni",
    lib = "@rules_java//toolchains:jni",
)

cmake(
    name = "host",
    cache_entries = {
        "CMAKE_BUILD_TYPE": "$(CMAKE_BUILD_TYPE)",
        "JNI_HEADER": "$(execpath :jni)",
        "FBJNI_SKIP_TESTS": "true",
    },
    data = [":jni"],
    env = {
        # TODO: Pull this from a build config, like CMAKE_BUILD_TYPE
        "CMAKE_BUILD_PARALLEL_LEVEL": "4"
    },
    generate_args = ["-G Ninja"],
    lib_name = "fbjni",
    lib_source = "working_directory",
    out_shared_libs = select({
        "@bazel_tools//src/conditions:darwin": ["libfbjni.dylib"],
        "//conditions:default": ["libfbjni.so"],
    }),
    toolchains = ["@player//:cmake_build_type"],
    visibility = ["//visibility:public"],
)

cmake(
    name = "android",
    cache_entries = {
        "ANDROID_ABI": "True",
        "CMAKE_BUILD_TYPE": "$CMAKE_BUILD_TYPE",
        "FBJNI_SKIP_TESTS": "true",
    },
    env = {
        "CMAKE_BUILD_TYPE": "$(CMAKE_BUILD_TYPE)",
        "CMAKE_BUILD_PARALLEL_LEVEL": "4"
    },
    generate_args = ["-G Ninja"],
    lib_name = "fbjni",
    lib_source = "working_directory",
    out_shared_libs = ["libfbjni.dylib"],
    toolchains = ["@player//:cmake_build_type"],
    visibility = ["//visibility:public"],
)
