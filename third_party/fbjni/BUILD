load("@rules_foreign_cc//foreign_cc:defs.bzl", "cmake")

filegroup(
    name = "working_directory",
    srcs = glob(["**"]),
)

cc_library(
    name = "libfbjni_headers",
    hdrs = glob(["cxx/fbjni/**/*.h"]),
    strip_include_prefix = "cxx",
    visibility = ["//visibility:public"],
)

filegroup(
    name = "jni",
    srcs = ["@bazel_tools//tools/jdk:jni_header"] + select({
        "@bazel_tools//src/conditions:darwin": ["@bazel_tools//tools/jdk:jni_md_header-darwin"],
        "@bazel_tools//src/conditions:freebsd": ["@bazel_tools//tools/jdk:jni_md_header-freebsd"],
        "@bazel_tools//src/conditions:openbsd": ["@bazel_tools//tools/jdk:jni_md_header-openbsd"],
        "@bazel_tools//src/conditions:windows": ["@bazel_tools//tools/jdk:jni_md_header-windows"],
        "@bazel_tools//src/conditions:linux": ["@bazel_tools//tools/jdk:jni_md_header-linux"],
        "//conditions:default": [],
    }),
)

genrule(
    name = "jni_include",
    srcs = [":jni"],
    outs = ["jni/include"],
    cmd = "mkdir $(OUTS) && cp $(SRCS) $$_",
    tags = ["no-cache"],
)

cmake(
    name = "host",
    cache_entries = {
        "CMAKE_BUILD_TYPE": "$CMAKE_BUILD_TYPE",
        # Normalize path relative to fbjni.build_tmpdir
        "JNI_HEADER": "$(realpath ../../$JNI_HEADER)",
        "FBJNI_SKIP_TESTS": "true",
    },
    data = [":jni_include"],
    env = {
        "CMAKE_BUILD_TYPE": "$(CMAKE_BUILD_TYPE)",
        # Resolves to fbjni/jni/include
        "JNI_HEADER": "$(rlocationpath :jni_include)",
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
    },
    generate_args = ["-G Ninja"],
    lib_name = "fbjni",
    lib_source = "working_directory",
    out_shared_libs = ["libfbjni.dylib"],
    toolchains = ["@player//:cmake_build_type"],
    visibility = ["//visibility:public"],
)
